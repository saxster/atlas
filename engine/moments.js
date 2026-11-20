// engine/moments.js — Pure, zero-DOM declarative show / do / ask lesson moment contract
// and runtime-stamped evidence evaluator adapted from withmarbleapp/os-taxonomy (`moments.mjs` & `outcome.mjs`).

export const OUTCOME_STATES = Object.freeze(['own', 'help', 'seen', 'none']);

export const DEFAULT_PASSIVE_EVENTS = Object.freeze([
  'camera_orbit',
  'model_rotate',
  'draft_edit',
  'pencil_hover',
]);

const VALID_INTERPRETATIONS = new Set(['understood', 'needs_help', 'acknowledged', 'question']);

/**
 * Stamps a tutor reading with provenance (`basis`) and assistance (`assisted`) directly
 * from the representation's own evidence events — never allowing an unbacked verbal gloss
 * or helped work to be marked independent.
 */
export function stampEvidence(
  reading,
  { origin = 'observation', latestWork = null, activeSceneId = null } = {},
) {
  if (!reading || typeof reading !== 'object') {
    throw new TypeError('stampEvidence requires a reading object');
  }
  const interpretation = VALID_INTERPRETATIONS.has(reading.interpretation)
    ? reading.interpretation
    : 'acknowledged';
  const helped = latestWork?.assisted === true;

  if (origin !== 'observation') {
    const sameTask = activeSceneId !== null && activeSceneId !== undefined && latestWork?.sceneId === activeSceneId;
    return {
      ...reading,
      interpretation,
      basis: 'words',
      assisted: helped && sameTask,
    };
  }

  return {
    ...reading,
    interpretation,
    basis: 'work',
    event: latestWork?.name ?? null,
    assisted: latestWork ? helped : true,
  };
}

const OUTCOME_FALLBACK = {
  seen: 'We looked at this together.',
  none: 'We have not tried this one yet.',
};

/**
 * Rolls stamped readings into deterministic per-skill states (`own | help | seen | none`).
 * Child-facing proof lines stand only when backed by real recorded evidence (`state !== 'none'`).
 */
export function computeOutcome({
  lessonId = '',
  topics = [],
  skills = [],
  focuses = [],
  learning = [],
  notes = {},
} = {}) {
  const goalsByFocus = Object.fromEntries(
    (focuses || []).map(f => [f.id, Array.isArray(f.goals) ? f.goals : []]),
  );

  const rows = (skills || []).map(skill => {
    const focusIds = Array.isArray(skill.focuses) ? skill.focuses : [];
    const records = (learning || []).filter(r => focusIds.includes(r.focus));
    const understood = records.filter(r => r.interpretation === 'understood');
    const independent = understood.filter(r => r.assisted !== true);
    const state = independent.length
      ? 'own'
      : understood.length
        ? 'help'
        : records.length
          ? 'seen'
          : 'none';
    const best = (independent.at(-1) ?? understood.at(-1))?.evidence;
    const childNote = notes && typeof notes === 'object' ? notes[skill.id] : null;
    const proof = (state !== 'none' && childNote) || best || OUTCOME_FALLBACK[state] || OUTCOME_FALLBACK.seen;
    const goals = [...new Set(focusIds.flatMap(fid => goalsByFocus[fid] ?? []))];
    return {
      skill: skill.id,
      title: skill.title || skill.description || skill.id,
      state,
      proof,
      goals,
    };
  });

  return {
    lesson: lessonId,
    topics: [...topics],
    skills: rows,
    shown: rows.filter(r => r.state === 'own').length,
    complete: rows.length > 0 && rows.every(r => r.state === 'own'),
    next: rows.find(r => r.state !== 'own')?.skill ?? null,
  };
}

/**
 * Verifies that an interactive/manipulative figure exposes an explicit symbolic bridge
 * (readout, formulas, equations, or notation) rather than unlinked visual motion alone.
 */
export function validateManipulativeSymbolBridge(chapter) {
  if (!chapter || typeof chapter !== 'object') {
    return { ok: false, reason: 'Missing chapter object.' };
  }
  const hasManipulation =
    (Array.isArray(chapter.controls) && chapter.controls.length > 0)
    || Boolean(chapter.params && Object.keys(chapter.params).length > 0)
    || (Array.isArray(chapter.PAGES) && chapter.PAGES.length > 1);
  if (!hasManipulation) {
    return { ok: true, reason: 'Static or non-manipulative figure.' };
  }
  const hasSymbolicBridge =
    typeof chapter.readout === 'function'
    || (Array.isArray(chapter.formulas) && chapter.formulas.length > 0)
    || (Array.isArray(chapter.equations) && chapter.equations.length > 0)
    || (Array.isArray(chapter.notation) && chapter.notation.length > 0)
    || Boolean(chapter.symbolBridge && String(chapter.symbolBridge).trim().length > 0);
  if (!hasSymbolicBridge) {
    return {
      ok: false,
      reason: 'Manipulative figure must expose at least one symbolic bridge (readout, formulas, equations, or notation).',
    };
  }
  return { ok: true, reason: 'Manipulative-to-symbol bridge present.' };
}

/**
 * Declares an interactive representation with `show`, `do`, and `ask` moments while enforcing:
 * - Anti-quiz invariant (cannot define `ask` without at least one `show` or `do`)
 * - Screen description vs in-world observer perception separation
 * - Non-destructive `aside` help & refusal of destructive `show` during an unanswered check
 * - Independent conceptual demand (`situation`) vs visual cue support (`supportsVisible`)
 * - Unified `voice`/`touch` answer grading with stale `sceneId` rejection
 * - State-scoped tool lists and passive-event classification
 */
export function defineLessonMoments(spec) {
  if (!spec || typeof spec !== 'object') {
    throw new TypeError('defineLessonMoments requires a specification object');
  }
  const shows = Array.isArray(spec.show) ? spec.show : [];
  const dos = Array.isArray(spec.do) ? spec.do : [];
  const asks = Array.isArray(spec.ask) ? spec.ask : [];

  if (asks.length > 0 && shows.length === 0 && dos.length === 0) {
    throw new Error('Anti-quiz invariant: a representation with ask moments must also define at least one show or do moment.');
  }
  if (typeof spec.describeScreen !== 'function') {
    throw new TypeError('defineLessonMoments requires describeScreen(state, facts)');
  }

  const passiveSet = new Set(spec.passiveEvents ?? DEFAULT_PASSIVE_EVENTS);
  const showById = new Map(shows.map(m => [m.id, m]));
  const doById = new Map(dos.map(m => [m.id, m]));
  const askById = new Map(asks.map(m => [m.id, m]));

  let revision = 1;
  let sceneSeq = 0;
  let state = structuredClone(spec.initialState ?? {});
  let activeActivity = null;
  let activeCheck = null;
  let activeAside = null;
  let latestWork = null;
  let latestAttempt = null;
  const attempts = [];

  const computeFacts = () => (typeof spec.facts === 'function' ? spec.facts(state) : { ...state });

  const isPassiveEvent = eventName => passiveSet.has(String(eventName || ''));

  const availableTools = () => {
    const tools = [];
    if (shows.length > 0) tools.push('show_moment');
    if (dos.length > 0) tools.push('start_activity');
    if (asks.length > 0) tools.push('start_check');
    if (activeCheck && activeCheck.status === 'awaiting') tools.push('answer_check');
    if (activeAside) tools.push('resume_activity');
    if (activeActivity || (activeCheck && activeCheck.status === 'awaiting')) tools.push('leave_activity');
    return tools;
  };

  const snapshot = () => {
    const facts = computeFacts();
    const screenDescription = spec.describeScreen(state, facts);
    const observerDescription = typeof spec.describeObserver === 'function'
      ? spec.describeObserver(state, facts)
      : null;
    return {
      revision,
      state: structuredClone(state),
      facts: structuredClone(facts),
      screenDescription,
      observerDescription,
      activeActivity: activeActivity ? structuredClone(activeActivity) : null,
      activeCheck: activeCheck ? structuredClone(activeCheck) : null,
      activeAside: activeAside ? structuredClone(activeAside) : null,
      latestWork: latestWork ? structuredClone(latestWork) : null,
      latestAttempt: latestAttempt ? structuredClone(latestAttempt) : null,
      availableTools: availableTools(),
      passiveEvents: [...passiveSet],
    };
  };

  return {
    isPassiveEvent,
    availableTools,
    snapshot,

    emitGesture(eventName, patchFn = null) {
      if (typeof patchFn === 'function') {
        const next = patchFn(structuredClone(state));
        if (next && typeof next === 'object') state = next;
      }
      if (!isPassiveEvent(eventName)) {
        revision += 1;
      }
      return { passive: isPassiveEvent(eventName), snapshot: snapshot() };
    },

    showMoment(id, { aside } = {}) {
      const moment = showById.get(id);
      if (!moment) {
        return { accepted: false, error: 'unknown_moment', snapshot: snapshot() };
      }
      const isAside = aside !== undefined ? Boolean(aside) : Boolean(moment.aside);
      if (activeCheck && activeCheck.status === 'awaiting' && !isAside) {
        return {
          accepted: false,
          error: 'active_check_unanswered',
          reason: 'Cannot replace the arrangement while a check is awaiting an answer unless aside is true.',
          snapshot: snapshot(),
        };
      }
      if (activeCheck && activeCheck.status === 'awaiting' && isAside) {
        activeAside = {
          momentId: id,
          savedState: structuredClone(state),
          savedCheck: structuredClone(activeCheck),
        };
        activeCheck.assisted = true;
      }
      if (typeof moment.apply === 'function') {
        const next = moment.apply(structuredClone(state));
        if (next && typeof next === 'object') state = next;
      }
      revision += 1;
      const speech = typeof moment.speech === 'function' ? moment.speech(state, computeFacts()) : (moment.speech ?? '');
      return {
        accepted: true,
        aside: isAside,
        speech,
        continueAfterSpeech: moment.continueAfterSpeech ?? true,
        snapshot: snapshot(),
      };
    },

    resumeActivity() {
      if (!activeAside) {
        return { accepted: false, error: 'no_active_aside', snapshot: snapshot() };
      }
      const restored = activeAside;
      activeAside = null;
      state = restored.savedState;
      activeCheck = restored.savedCheck;
      if (activeCheck) {
        activeCheck.assisted = true;
        activeCheck.revealedFields = [];
      }
      revision += 1;
      return { accepted: true, snapshot: snapshot() };
    },

    startActivity(id) {
      const act = doById.get(id);
      if (!act) {
        return { accepted: false, error: 'unknown_activity', snapshot: snapshot() };
      }
      if (activeCheck && activeCheck.status === 'awaiting') {
        return { accepted: false, error: 'active_check_unanswered', snapshot: snapshot() };
      }
      sceneSeq += 1;
      const sceneId = `${id}#${sceneSeq}`;
      if (typeof act.apply === 'function') {
        const next = act.apply(structuredClone(state));
        if (next && typeof next === 'object') state = next;
      }
      activeActivity = {
        id,
        sceneId,
        counts: Boolean(act.counts),
        goalReached: false,
        assisted: false,
      };
      revision += 1;
      return { accepted: true, sceneId, snapshot: snapshot() };
    },

    recordGoalReached({ assisted = false } = {}) {
      if (!activeActivity) {
        return { accepted: false, error: 'no_active_activity', snapshot: snapshot() };
      }
      activeActivity.goalReached = true;
      if (assisted) activeActivity.assisted = true;
      if (activeActivity.counts) {
        latestWork = {
          name: 'goal_reached',
          sceneId: activeActivity.sceneId,
          assisted: Boolean(activeActivity.assisted),
        };
      }
      revision += 1;
      return { accepted: true, snapshot: snapshot() };
    },

    startCheck(id, { situation = 'default', supportsVisible = true, retry = false } = {}) {
      const check = askById.get(id);
      if (!check) {
        return { accepted: false, error: 'unknown_check', snapshot: snapshot() };
      }
      sceneSeq += 1;
      const sceneId = `${id}#${sceneSeq}`;
      if (typeof check.setup === 'function') {
        const next = check.setup(structuredClone(state), { situation, supportsVisible });
        if (next && typeof next === 'object') state = next;
      }
      const facts = computeFacts();
      const question = typeof check.question === 'function' ? check.question(facts, state) : check.question;
      const choices = typeof check.choices === 'function' ? check.choices(facts, state) : (check.choices ?? null);
      activeCheck = {
        id,
        sceneId,
        situation,
        supportsVisible: Boolean(supportsVisible),
        prompt: question,
        choices: choices ? [...choices] : null,
        hiddenFields: Array.isArray(check.hide) ? [...check.hide] : [],
        revealedFields: [],
        status: 'awaiting',
        assisted: Boolean(retry),
      };
      revision += 1;
      return { accepted: true, sceneId, snapshot: snapshot() };
    },

    answerCheck(sceneId, { value, modality = 'touch', words = '' } = {}) {
      if (!activeCheck) {
        return { accepted: false, error: 'no_active_check', snapshot: snapshot() };
      }
      if (activeCheck.sceneId !== sceneId) {
        return { accepted: false, error: 'stale_scene_id', snapshot: snapshot() };
      }
      if (activeCheck.status !== 'awaiting') {
        return { accepted: false, error: 'check_already_answered', snapshot: snapshot() };
      }
      const check = askById.get(activeCheck.id);
      const facts = computeFacts();
      const isCorrect = typeof check.grade === 'function'
        ? Boolean(check.grade(value, facts, state))
        : String(value) === String(check.answer);

      activeCheck.status = 'answered';
      activeCheck.revealedFields = Array.isArray(check.reveal) ? [...check.reveal] : [];
      activeAside = null;

      latestAttempt = {
        sceneId,
        checkId: activeCheck.id,
        value,
        modality: modality === 'voice' ? 'voice' : 'touch',
        words: String(words ?? ''),
        situation: activeCheck.situation,
        supportsVisible: activeCheck.supportsVisible,
        isCorrect,
        assisted: Boolean(activeCheck.assisted),
      };
      attempts.push(latestAttempt);
      latestWork = {
        name: 'response_committed',
        sceneId,
        assisted: Boolean(activeCheck.assisted),
        isCorrect,
      };
      revision += 1;
      return { accepted: true, attempt: structuredClone(latestAttempt), snapshot: snapshot() };
    },

    leaveActivity() {
      if (!activeActivity && (!activeCheck || activeCheck.status !== 'awaiting')) {
        return { accepted: false, error: 'nothing_to_leave', snapshot: snapshot() };
      }
      activeActivity = null;
      if (activeCheck && activeCheck.status === 'awaiting') {
        activeCheck = { ...activeCheck, status: 'left' };
      }
      activeAside = null;
      revision += 1;
      return { accepted: true, snapshot: snapshot() };
    },

    getAttempts: () => structuredClone(attempts),
  };
}
