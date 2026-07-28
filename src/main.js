import { ObserverApp } from './ui/observer.js';
import { initPwa } from './pwa.js';

initPwa();
const app = new ObserverApp(document.getElementById('app'));
