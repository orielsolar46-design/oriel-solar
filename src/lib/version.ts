/**
 * The back-office app version, shown in the rail.
 *
 * Bump this when something the owner would notice changes. It is here rather
 * than read from package.json because the value has to reach the browser
 * bundle, and because the shopfront and the app version different things: the
 * shop is a website that is simply current, the app is a thing sitting on
 * someone's home screen that may be a version behind until the service worker
 * updates it.
 */
export const APP_VERSION = '1.0.0';
