
















































(function () {
	'use strict';

	var DOC = document;
	var ROOT = DOC.documentElement;
	var NS = 'sakura-ui';



	var KEY = {
		skin: 'dolUiSkin', font: 'dolUiFont', fx: 'dolUiFx',
		cap: 'dolUiCap', rows: 'dolUiRows', read: 'dolUiRead'
	};
	var DEF = { skin: 'sakura', font: 'a', fx: 'on', cap: 'on', rows: 'on', read: 'soft' };
	var ENUM = {
		skin: ['ink', 'sakura', 'mist', 'cocoa'],



		font: ['none', 'a'],
		fx: ['on', 'off'],


		read: ['bright', 'soft', 'warm']
	};
	var BOOLS = ['cap', 'rows'];
































	var FONT_ENTRY = 'fonts/maoken-assorted-lite.woff2';
	var FONT_FAM = 'DolUiMaoken';
	var fontState = 'idle';



	function zipReader() {
		try {
			var m = window.modSC2DataManager;
			if (!m || typeof m.getModUtils !== 'function') return null;
			var u = m.getModUtils();
			if (!u || typeof u.getModZip !== 'function') return null;
			var zr = u.getModZip(NS);
			if (!zr || typeof zr.getZipFile !== 'function') return null;
			var zip = zr.getZipFile();
			return (zip && typeof zip.file === 'function') ? zip : null;
		} catch (e) { return null; }
	}


	function faceRegistered() {
		var found = false;
		document.fonts.forEach(function (f) {
			if (String(f.family).replace(/^["']|["']$/g, '') === FONT_FAM) found = true;
		});
		return found;
	}

	function loadPackageFont() {


		if (fontState === 'ready' || fontState === 'loading' ||
			fontState === 'no-entry' || fontState === 'decode-fail') return;
		if (get('font') !== 'a') return;




		if (faceRegistered()) { fontState = 'ready'; return; }
		var zip = zipReader();
		if (!zip) { fontState = 'no-zip'; return; }
		var entry = zip.file(FONT_ENTRY);
		if (!entry) { fontState = 'no-entry'; return; }
		fontState = 'loading';
		entry.async('arraybuffer').then(function (buf) {
			var face = new FontFace(FONT_FAM, buf);
			return face.load().then(function (loaded) {
				document.fonts.add(loaded);
				fontState = 'ready';
			});
		}, function () { fontState = 'decode-fail'; }).catch(function () {
			fontState = 'decode-fail';
		});
	}



	var lsOk = true;
	function lsGet(k) {
		if (!lsOk) return null;
		try { return window.localStorage.getItem(k); }
		catch (e) { lsOk = false; return null; }
	}
	function lsSet(k, v) {
		if (!lsOk) return;
		try { window.localStorage.setItem(k, v); } catch (e) { lsOk = false; }
	}



	function get(name) {
		if (!DEF.hasOwnProperty(name)) return null;
		var raw = lsGet(KEY[name]);
		if (raw === null || raw === '') return DEF[name];
		if (ENUM[name]) return ENUM[name].indexOf(raw) >= 0 ? raw : DEF[name];
		return (raw === 'off' || raw === 'false') ? 'off' : 'on';
	}
	function set(name, value) {
		if (!DEF.hasOwnProperty(name)) return;


		if (ENUM[name]) { if (ENUM[name].indexOf(value) < 0) return; }
		else value = (value === 'off' || value === false) ? 'off' : 'on';
		lsSet(KEY[name], value);
		apply();



		hydrate(DOC.getElementById(PANEL));
	}




	function apply() {
		var skin = get('skin'), font = get('font'), light = skin !== 'ink';
		toggle('data-dol-skin', light ? skin : null);





		toggle('data-dol-tone', light ? 'light' : null);
		toggle('data-dol-font', font === 'none' ? null : font);

		toggle('data-dol-read', get('read') === 'soft' ? null : get('read'));
		toggle('data-dol-fx', get('fx') === 'off' ? 'off' : null);
		for (var i = 0; i < BOOLS.length; i++)
			toggle('data-dol-' + BOOLS[i], get(BOOLS[i]) === 'off' ? 'off' : null);



		loadPackageFont();
	}
	function toggle(attr, value) {
		if (value === null) ROOT.removeAttribute(attr);
		else ROOT.setAttribute(attr, value);
	}




	var PANEL = 'dolUiPanel';

	function hydrate(root) {
		if (!root) return;
		var els = root.querySelectorAll('[data-dolui-pref]');
		for (var i = 0; i < els.length; i++) {
			var el = els[i], name = el.getAttribute('data-dolui-pref');
			if (!DEF.hasOwnProperty(name)) continue;
			if (el.type === 'radio') el.checked = (get(name) === el.value);
			else if (el.type === 'checkbox') el.checked = (get(name) !== 'off');
		}




		var warn = root.querySelector('[data-dolui-note="storage"]');
		if (warn) warn.hidden = lsOk;
	}

	function onChange(e) {
		var el = e.target;
		if (!el || el.nodeType !== 1) return;
		var name = el.getAttribute && el.getAttribute('data-dolui-pref');
		if (!name) return;
		if (el.type === 'radio') { if (!el.checked) return; set(name, el.value); }
		else if (el.type === 'checkbox') set(name, el.checked ? 'on' : 'off');
	}

	function onReset(e) {
		var el = e.target;
		if (!el || !el.getAttribute || el.getAttribute('data-dolui-act') !== 'reset') return;
		for (var k in DEF) if (DEF.hasOwnProperty(k)) lsSet(KEY[k], '');
		apply();
		hydrate(DOC.getElementById(PANEL));
	}




















	function watch() {
		hydrate(DOC.getElementById(PANEL));
		if (typeof window.MutationObserver !== 'function') return;
		new window.MutationObserver(function () {
			hydrate(DOC.getElementById(PANEL));
		}).observe(ROOT, { childList: true, subtree: true });
	}







	var GLOBAL = 'DolUiPrefs';





	var API = { get: get, set: set, apply: apply, version: '1.0.10' };

	function boot() {












		DOC.addEventListener('change', onChange, true);
		DOC.addEventListener('click', onReset, true);
		watch();
		if (!lsOk) console.warn(NS + ': localStorage 不可用，本次会话的界面偏好不会记住（界面照常生效）。');
	}
	try { window[GLOBAL] = API; }
	catch (e) {  }






	apply();
	if (DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded', boot);
	else boot();
})();
