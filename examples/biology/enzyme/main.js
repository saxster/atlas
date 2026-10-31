import { SUBJECT } from '../subject.js';
import { FIGURE } from './figure.js';
import { startMachine } from '@saxster/atlas/machine.js';
startMachine({ ...FIGURE, subject: SUBJECT });
