import app from './worker';
import { registerCensusReconcileRoute } from './server/censusReconcile';

registerCensusReconcileRoute(app);

export default app;
