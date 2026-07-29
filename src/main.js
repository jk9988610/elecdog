import { runOtaBootstrap } from './ota/updater.js';
import { ObserverApp } from './ui/observer.js';

await runOtaBootstrap();
new ObserverApp(document.getElementById('app'));
