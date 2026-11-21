import { SUBJECT } from '../subject.js';
import { FIGURE } from './figure.js';
import { startExplorer } from '@saxster/atlas/explorer.js';
startExplorer({ ...FIGURE, subject: SUBJECT });
