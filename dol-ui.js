
































































(function () {
	'use strict';

	var DOC = document;
	var NS = 'dolUi';








	function prefOn(name) {
		return DOC.documentElement.getAttribute('data-dol-' + name) !== 'off';
	}

	function make(tag, cls, mark) {
		var n = DOC.createElement(tag);
		if (cls) n.className = cls;
		n.setAttribute('data-dol', mark);
		return n;
	}

	function isBlank(node) {
		return !!node && node.nodeType === 3 && !/\S/.test(node.nodeValue);
	}




	function isBr(node) {
		return !!node && node.nodeType === 1 && node.tagName === 'BR';
	}


	function isIconEl(node) {
		return !!node && node.nodeType === 1 && node.tagName === 'IMG' &&
			/(^|[\s])icon([\s]|$)/.test(node.className || '');
	}











	function isIconSlot(node) {
		return !!node && node.nodeType === 1 && !!node.classList &&
			node.classList.contains('icon-container');
	}


	function isAnyIcon(node) {
		return isIconEl(node) || isIconSlot(node);
	}

	function isLinkEl(node) {
		return !!node && node.nodeType === 1 &&
			(node.tagName === 'A' || (node.classList && node.classList.contains('macro-link')));
	}








	function isEmptyContainer(node) {
		if (!node || node.nodeType !== 1) return false;
		if (node.tagName !== 'DIV' && node.tagName !== 'SPAN') return false;
		if (/\S/.test(node.textContent || '')) return false;
		return !(node.children && node.children.length);
	}


	function isInert(node) {
		return isBlank(node) || isEmptyContainer(node);
	}


	function isMine(node) {
		return node.nodeType === 1 && node.hasAttribute && node.hasAttribute('data-dol');
	}








	function childByClass(box, cls) {
		for (var c = box.firstElementChild; c; c = c.nextElementSibling) {
			if (c.classList && c.classList.contains(cls)) return c;
		}
		return null;
	}

	function childByMark(box, mark) {
		for (var c = box.firstElementChild; c; c = c.nextElementSibling) {
			if (c.getAttribute && c.getAttribute('data-dol') === mark) return c;
		}
		return null;
	}


	function searchGroup(list) {
		var ob = childByClass(list, 'optionsBar');
		return ob ? childByClass(ob, 'searchGroup') : null;
	}







	var NARROW = typeof window.matchMedia === 'function' ? window.matchMedia('(max-width: 600px)') : null;
	function isNarrow() { return NARROW ? NARROW.matches : false; }


	function barOf() {
		var list = DOC.getElementById('clothes-list');
		return list ? childByMark(list, 'buybar') : null;
	}







	function groupCaption() {
		if (!prefOn('cap')) return;
		var cap = DOC.getElementById('storyCaptionContent');
		if (!cap) return;

		var kids = [].slice.call(cap.childNodes);
		var cur = null;

		for (var i = 0; i < kids.length; i++) {
			var node = kids[i];

			if (isMine(node)) { cur = null; continue; }
			if (isBlank(node)) { continue; }
			if (isBr(node)) {




				cap.removeChild(node);
				cur = null;
				continue;
			}
			if (!cur) {
				cur = make('div', 'dol-cap-seg', 'cap-seg');
				cap.insertBefore(cur, node);
			}
			cur.appendChild(node);
		}


		var segs = [].slice.call(cap.children).filter(function (c) {
			return c.getAttribute('data-dol') === 'cap-seg';
		});
		for (var s = 0; s < segs.length; s++) segs[s].setAttribute('data-dol-seg', String(s));
	}
















	var HEADING_PUNCT = /[。！？，、；：…"'（）()《》\-—~·|]/;
	var HEADING_OWNLINE = /^[^\S\n]*\n+[^\n]*\S[^\n]*\n[^\S\n]*$/;
	var HEADING_WORD = /[\u4e00-\u9fa5A-Za-z]/;












	function isBareLine(v) { return v.indexOf('\n') < 0 && v.indexOf('\r') < 0; }
	function headingText(nodeValue) {
		if (!isBareLine(nodeValue) && !HEADING_OWNLINE.test(nodeValue)) return null;
		var t = nodeValue.replace(/[\s\t\r\n]+/g, '');
		if (!t || t.length < 2 || t.length > 16) return null;
		if (!HEADING_WORD.test(t)) return null;
		if (HEADING_PUNCT.test(t)) return null;
		if (/\d/.test(t)) return null;
		return t;
	}








	function neighbor(kids, i, dir) {
		for (var j = i + dir; j >= 0 && j < kids.length; j += dir) {
			if (!isInert(kids[j])) return kids[j];
		}
		return null;
	}


	function headsLinkList(kids, i, bare) {
		var prev = neighbor(kids, i, -1);
		if (prev && !isBr(prev)) return false;
		var next = neighbor(kids, i, 1);
		if (!next) return false;
		if (next.nodeType !== 1) return false;
		if (!bare) return isBr(next) || isLinkEl(next) || isAnyIcon(next);




		if (!isBr(next)) return false;
		for (var j = kids.indexOf(next) + 1; j < kids.length; j++) {
			if (isInert(kids[j])) continue;
			return isLinkEl(kids[j]) || isAnyIcon(kids[j]);
		}
		return false;
	}







	function ownsItsLine(kids, i) {
		var lo = i, hi = i, links = 0, j, n;
		while (lo - 1 >= 0 && !isBr(kids[lo - 1])) lo--;
		while (hi + 1 < kids.length && !isBr(kids[hi + 1])) hi++;
		for (j = lo; j <= hi; j++) {
			n = kids[j];
			if (isInert(n)) continue;
			if (n.nodeType === 3) return false;
			if (isLinkEl(n)) { links++; if (links > 1) return false; continue; }
			if (isAnyIcon(n)) continue;
			return false;
		}
		return links === 1;
	}


	var COST_RE = /\s*\((\d{1,3}:\d{2})\)\s*$/;









	function splitCost(link) {
		var last = link.lastChild;
		if (!last || last.nodeType !== 3) return;
		var m = COST_RE.exec(last.nodeValue);
		if (!m) return;
		last.nodeValue = last.nodeValue.replace(COST_RE, '');
		if (!last.nodeValue) link.removeChild(last);
		var rest = [].slice.call(link.childNodes);
		if (rest.length) {
			var tx = make('span', 'dol-tx', 'tx');
			for (var k = 0; k < rest.length; k++) tx.appendChild(rest[k]);
			link.appendChild(tx);
		}
		var cost = make('span', 'dol-cost', 'cost');
		cost.textContent = m[1];
		link.appendChild(cost);
	}








	function dropBrRun(from, dir) {
		for (var n = from; n;) {
			if (isBlank(n)) { n = n[dir]; continue; }
			if (!isBr(n)) return;
			var nxt = n[dir];
			n.parentNode.removeChild(n);
			n = nxt;
		}
	}


	function dropEdgeBr(row) {
		dropBrRun(row.previousSibling, 'previousSibling');
		dropBrRun(row.nextSibling, 'nextSibling');
	}

	function groupLinks() {
		if (!prefOn('rows')) return;
		var pc = DOC.getElementById('passage-content');
		if (!pc) return;

		var kids = [].slice.call(pc.childNodes);

		for (var i = 0; i < kids.length; i++) {
			var node = kids[i];


			if (node.nodeType === 3) {
				if (isBlank(node)) continue;
				var txt = headingText(node.nodeValue);
				if (txt === null) continue;
				if (!headsLinkList(kids, i, isBareLine(node.nodeValue))) continue;
				var grp = make('div', 'dol-grp', 'grp');
				grp.textContent = txt;
				pc.insertBefore(grp, node);
				pc.removeChild(node);
				continue;
			}

			if (node.nodeType !== 1 || isMine(node)) continue;





			if (isAnyIcon(node)) {
				if (!ownsItsLine(kids, i)) continue;
				var link = node.nextSibling;
				while (link && isBlank(link)) link = link.nextSibling;
				if (!link || link.nodeType !== 1 || !link.classList || !link.classList.contains('macro-link')) continue;
				var row = make('span', 'dol-lrow', 'lrow');
				pc.insertBefore(row, node);
				row.appendChild(node);
				row.appendChild(link);
				splitCost(link);
				dropEdgeBr(row);
				continue;
			}


			if (isLinkEl(node) && node.parentNode === pc) {
				if (!ownsItsLine(kids, i)) continue;
				splitCost(node);
				var solo = make('span', 'dol-lrow', 'lrow');
				pc.insertBefore(solo, node);
				solo.appendChild(node);
				dropEdgeBr(solo);
				continue;
			}

		}
	}


















	var CAT_LABEL = {
		all: '全部', 'over-outfit': '外套装', outfit: '套装', upper: '上装', lower: '下装',
		'under-outfit': '内衣套装', 'under-upper': '内上装', 'under-lower': '内下装',
		head: '头饰', face: '面饰', neck: '颈饰', handheld: '手持', hand: '手饰',
		legs: '袜子', feet: '鞋类'
	};

	function shopCategoryLabels() {
		var box = DOC.getElementById('shopCategories');
		if (!box) return;
		var tabs = box.querySelectorAll('.category-tab');
		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[i];
			if (tab.querySelector('[data-dol="cat-name"]')) continue;
			var img = tab.querySelector('img');
			var src = img ? img.getAttribute('src') : '';
			if (!src) continue;
			var label = CAT_LABEL[src.split('/').pop().replace(/\.png$/i, '')];
			if (typeof label !== 'string') continue;
			var name = make('span', 'dol-cat-name', 'cat-name');
			name.textContent = label;
			tab.insertBefore(name, img.nextSibling);
		}
	}





















	function makeStripBtn(dir, box) {
		var b = DOC.createElement('button');
		b.type = 'button';
		b.className = 'dol-strip-nav';
		b.setAttribute('data-dol', dir ? 'strip-next' : 'strip-prev');
		b.setAttribute('aria-label', dir ? '向右翻页' : '向左翻页');
		b.addEventListener('click', function () {


			var d = dir ? 1 : -1;
			var step = Math.round(Math.max(60, (box.clientWidth || 200) * 0.8));
			if (box.scrollBy) box.scrollBy({ left: d * step, behavior: 'smooth' });
			else box.scrollLeft = (box.scrollLeft || 0) + d * step;
		});
		return b;
	}

	function stripNav(box, absHost) {
		var host = box && box.parentElement;
		if (!host) return;
		var btns;
		if (!absHost) {



			var row = host.classList.contains('dol-strip-row') ? host : null;
			if (row) {
				var okRow = row.children.length === 3
					&& row.firstElementChild.classList.contains('dol-strip-nav')
					&& row.lastElementChild.classList.contains('dol-strip-nav')
					&& row.firstElementChild.nextElementSibling === box;
				if (okRow) {
					if (box.__dolNavSync) box.__dolNavSync();
					return;
				}
			} else {
				row = DOC.createElement('div');
				row.className = 'dol-strip-row';
				host.insertBefore(row, box);
				row.appendChild(box);
			}

			for (var y = row.children.length - 1; y >= 0; y--) {
				if (row.children[y] !== box) row.removeChild(row.children[y]);
			}
			btns = [makeStripBtn(0, box), makeStripBtn(1, box)];
			row.insertBefore(btns[0], box);
			row.appendChild(btns[1]);
		} else {
			var stale = box.querySelectorAll('.dol-strip-nav');
			for (var s = 0; s < stale.length; s++) stale[s].parentNode.removeChild(stale[s]);
			var pair = box.previousElementSibling && box.previousElementSibling.classList.contains('dol-strip-nav')
				&& box.previousElementSibling.previousElementSibling
				&& box.previousElementSibling.previousElementSibling.classList.contains('dol-strip-nav');
			if (pair) return;
			var half = false;
			for (var c = 0; c < 2; c++) {
				var sib = c ? box.nextElementSibling : box.previousElementSibling;
				if (sib && sib.classList.contains('dol-strip-nav')) half = true;
			}
			if (half) {
				for (var g = host.children.length - 1; g >= 0; g--) {
					if (host.children[g].classList.contains('dol-strip-nav')) host.removeChild(host.children[g]);
				}
			}
			if (absHost) host.classList.add('dol-strip-host');
			btns = [makeStripBtn(0, box), makeStripBtn(1, box)];
			host.insertBefore(btns[0], box);
			host.insertBefore(btns[1], box);
		}




		box.__dolNavSync = function () {
			var cw = box.clientWidth || 0;
			if (cw <= 0) { btns[0].disabled = false; btns[1].disabled = false; return; }
			var max = (box.scrollWidth || 0) - cw;
			btns[0].disabled = (box.scrollLeft || 0) <= 1;
			btns[1].disabled = (box.scrollLeft || 0) >= max - 1;
		};
		if (!box.__dolNavBound) {
			box.__dolNavBound = 1;
			box.addEventListener('scroll', function () { if (box.__dolNavSync) box.__dolNavSync(); }, { passive: true });
			if (typeof window.addEventListener === 'function') {
				window.addEventListener('resize', function () { if (box.__dolNavSync) box.__dolNavSync(); }, { passive: true });
			}
		}
		box.__dolNavSync();
		if (typeof window.requestAnimationFrame === 'function') {
			window.requestAnimationFrame(function () { if (box.__dolNavSync) box.__dolNavSync(); });
		}
	}

	function shopStripNavs() {
		stripNav(DOC.getElementById('shopCategories'), false);
		var dets = DOC.querySelectorAll('.clothing-details');
		for (var i = 0; i < dets.length; i++) {
			var rows = dets[i].querySelectorAll('.colour-options-div');
			for (var j = 0; j < rows.length; j++) stripNav(rows[j], true);
		}
	}











	var shopPick = '';
	var shopPrice = '';

	function shopDetailTitle() {
		var det = DOC.querySelector('.clothing-details');
		if (!det) { shopPick = ''; shopPrice = ''; return; }
		var real = false;
		for (var c = det.firstElementChild; c; c = c.nextElementSibling) {
			if (!isMine(c)) { real = true; break; }
		}
		var old = det.querySelector('[data-dol="shop-title"]');
		if (!real) {
			if (old) det.removeChild(old);
			shopPick = ''; shopPrice = '';
			return;
		}
		if (old) {
			if (old.firstChild.nodeValue !== shopPick) old.firstChild.nodeValue = shopPick;
			if (old.lastChild.textContent !== shopPrice) old.lastChild.textContent = shopPrice;
			return;
		}
		if (!shopPick) return;
		var head = make('div', 'dol-shop-title', 'shop-title');
		head.appendChild(DOC.createTextNode(shopPick));
		var note = make('span', 'dol-shop-title-note', 'shop-note');
		note.textContent = shopPrice;
		head.appendChild(note);
		det.insertBefore(head, det.firstElementChild);
	}







	var PICK_KEY = /^\(\s*(?:Shift\s*\+\s*)?\d+\s*\)\s*/;
	var PICK_OWNED = '|';

	function pickName(raw) {
		var t = (raw || '').replace(/\s+/g, ' ').trim().replace(PICK_KEY, '');
		var bar = t.indexOf(PICK_OWNED);
		if (bar >= 0) t = t.slice(0, bar);
		return t.trim();
	}


	function onShopClick(ev) {
		var t = ev.target;
		if (!t || !t.closest) return;
		var item = t.closest('.clothing-item');
		if (!item) return;
		var nm = item.querySelector('.clothing-name');
		var pr = item.querySelector('.clothing-price');
		shopPick = nm ? pickName(nm.textContent) : '';
		shopPrice = pr ? (pr.textContent || '').trim() : '';
	}





	function renameClearBtn(btn) {
		for (var n = btn.firstChild; n; n = n.nextSibling) {
			if (n.nodeType === 3 && /\S/.test(n.nodeValue)) { n.nodeValue = '清空'; return; }
		}
		if (!btn.firstElementChild) btn.textContent = '清空';
	}



















	function shopReflow() {
		var list = DOC.getElementById('clothes-list');
		var det = DOC.querySelector('.clothing-details');
		if (!list || !det) return;
		for (var c = det.firstElementChild; c; c = c.nextElementSibling) {
			if (isMine(c)) return;
		}

		var kids = [].slice.call(det.childNodes);
		var group = searchGroup(list);
		var bar = dolHost(list, 'dol-buybar', 'buybar');
		var buy = childByClass(bar, 'buy-buttons');
		if (buy) bar.removeChild(buy);
		var tryp = childByClass(bar, 'try-buttons');
		if (tryp) bar.removeChild(tryp);
		var info = childByMark(list, 'shop-info');
		if (info) list.removeChild(info);
		var cart = childByMark(det, 'shop-cart');
		if (cart) { det.removeChild(cart); cartBox = null; }

		shopDescBlock(det, kids);
		shopInfoBlock(list, kids);


		var src = childByClass(det, 'buy-buttons');
		var btn = childByMark(bar, 'bar-clear') || (group ? childByMark(group, 'bar-clear') : null);
		if (!btn && group) {
			for (var i = 0; i < group.children.length; i++) {
				if (group.children[i].tagName === 'BUTTON') {
					btn = group.children[i];
					btn.setAttribute('data-dol', 'bar-clear');
					renameClearBtn(btn);
					break;
				}
			}
		}
		if (src) {
			bar.appendChild(src);



			if (btn) {
				if (isNarrow()) { if (group && btn.parentNode !== group) group.appendChild(btn); }
				else bar.insertBefore(btn, bar.firstChild);
			}
		} else if (btn && group && btn.parentNode !== group) {
			group.appendChild(btn);
		}
		var cs = cartSources();
		shopCartBlock(det, cs);
		shopCartBar(bar, cs);
	}


	function dolHost(list, cls, mark) {
		var box = childByMark(list, mark);
		if (!box) {
			box = make('div', cls, mark);
			list.appendChild(box);
		}
		return box;
	}














	function shopDescBlock(det, kids) {
		var colours = childByClass(det, 'clothing-colours-div');
		if (!colours) return;
		var end = kids.indexOf(colours);
		var cut = 0;
		if (isNarrow()) {
			for (var t = 0; t < end; t++) {
				if (kids[t].classList && kids[t].classList.contains('trait-description')) { cut = t; break; }
			}
			if (cut === 0) cut = end;
		}

		var chips = make('div', 'dol-shop-chips', 'shop-chips');
		var desc = make('div', 'dol-shop-desc', 'shop-desc');
		for (var i = 0; i < end; i++) {
			if (kids[i].parentNode !== det || isMine(kids[i])) continue;



			(kids[i].nodeType === 3 ? desc : (i < cut ? chips : desc)).appendChild(kids[i]);
		}
		if (/\S/.test(chips.textContent)) {
			var man = childByClass(colours, 'mannequin');
			colours.insertBefore(chips, man ? man.nextSibling : colours.firstChild);
		}
		det.insertBefore(desc, colours.nextSibling);
		if (!/\S/.test(desc.textContent)) desc.parentNode.removeChild(desc);
	}










	function shopInfoBlock(list, kids) {
		var scale = null;
		var desc = null;
		var buyIdx = -1;
		for (var i = 0; i < kids.length; i++) {
			var n = kids[i];
			if (n.nodeType !== 1 || isMine(n)) continue;
			if (n.classList && n.classList.contains('warmth-scale-container')) scale = n;
			if (n.id === 'warmth-description') desc = n;
			if (n.classList && n.classList.contains('buy-buttons')) buyIdx = i;
		}
		if (!scale && !desc) return;
		var anchor = kids.indexOf(scale || desc);
		var take = [];
		for (var k = anchor; k < kids.length; k++) {
			var m = kids[k];
			if (m === scale || m === desc || isBr(m) || isBlank(m) || m.nodeType === 3) { take.push(m); continue; }
			break;
		}
		var back = [];
		for (var b = buyIdx - 1; b > anchor; b--) {
			var t = kids[b];
			if (isBr(t) || isBlank(t)) continue;
			if (t.nodeType === 3) { back.push(t); continue; }
			break;
		}
		while (back.length) {
			var x = back.pop();
			if (take.indexOf(x) < 0) take.push(x);
		}
		for (var j = anchor - 1; j >= 0; j--) {
			if (isBlank(kids[j])) continue;
			if (kids[j].nodeType === 3 || (kids[j].tagName === 'SPAN' && !isMine(kids[j]))) take.unshift(kids[j]);
			break;
		}
		if (take.length < 2) return;
		var box = dolHost(list, 'dol-shop-info', 'shop-info');
		for (var q = 0; q < take.length; q++) if (take[q].parentNode) box.appendChild(take[q]);
		shopWarmToggle(box);
	}






	function shopWarmToggle(box) {
		var btn = childByMark(box, 'warm-toggle');
		if (btn) return;
		btn = make('button', 'dol-warm-toggle', 'warm-toggle');
		btn.type = 'button';
		btn.textContent = '详情';
		btn.addEventListener('click', function () {
			var open = box.getAttribute('data-dol-warm') === 'open';
			box.setAttribute('data-dol-warm', open ? 'closed' : 'open');
			btn.textContent = open ? '详情' : '收起';
		});
		box.appendChild(btn);
	}











	var cartBox = null;







	function cartSources() {
		var list = DOC.getElementById('clothes-list');
		var bar = list ? childByMark(list, 'buybar') : null;
		var det = DOC.querySelector('.clothing-details');
		var buy = (bar && childByClass(bar, 'buy-buttons')) || (det && childByClass(det, 'buy-buttons'));
		var wear = buy ? childByClass(buy, 'buy-button') : null;
		var wearInner = wear ? childByClass(wear, 'buy-button-inner') : null;
		var send = DOC.getElementById('buy-send-home');
		var sendBtn = send ? childByClass(send, 'buy-button') : null;
		var sendInner = sendBtn ? childByClass(sendBtn, 'buy-button-inner') : null;
		var qty = DOC.getElementById('numberslider-value-buymultiple');
		var gold = function (box) {
			var g = box ? box.querySelector('.gold') : null;
			return g ? clean(g.textContent) : '';
		};
		return {
			unit: gold(wearInner),
			total: gold(sendInner),
			qty: qty ? clean(qty.textContent) : '',
			blocked: !!(sendInner && sendInner.classList && sendInner.classList.contains('disabled')),


			hasBuy: !!buy
		};
	}

	function clean(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }

	function cartRow(box, mark, key, text) {
		if (!text) return;
		var row = make('div', 'dol-cart-row', mark);
		var k = DOC.createElement('span');
		var v = DOC.createElement('span');
		k.className = 'dol-cart-k';
		v.className = 'dol-cart-v';
		k.textContent = key;
		v.textContent = text;
		row.appendChild(k);
		row.appendChild(v);
		box.appendChild(row);
	}


	function cartWrite(box, mark, text) {
		var row = childByMark(box, mark);
		if (!row) return;
		row.hidden = !text;
		if (text && row.lastChild.textContent !== text) row.lastChild.textContent = text;
	}


























	function mqKids(box) {
		var out = [];
		if (!box) return out;
		for (var i = 0; i < box.children.length; i++) {
			var k = box.children[i];
			if (k.classList && (k.classList.contains('mannequin-buttons') || k.classList.contains('mannequin-buttons-right'))) out.push(k);
		}
		return out;
	}








	function shopMannequinRow(det) {
		var man = det.querySelector('#mannequin');
		var inner = man && man.querySelector('.mannequin-inner');
		if (!inner) return;
		var bar = barOf();
		var row = det.querySelector('.try-buttons') || (bar ? childByClass(bar, 'try-buttons') : null);
		var cols = childByClass(det, 'clothing-colours-div');
		var dst = isNarrow() ? cols : row;
		if (!dst) return;


		var others = [];
		var cand = [inner, row, cols];
		for (var c = 0; c < cand.length; c++) {
			if (cand[c] && cand[c] !== dst && others.indexOf(cand[c]) < 0) others.push(cand[c]);
		}
		var fresh = mqKids(inner);
		var take = fresh.slice();
		if (!take.length) {
			for (var o = 0; o < others.length; o++) take = take.concat(mqKids(others[o]));
		}
		var need = [];
		for (var n = 0; n < take.length; n++) if (take[n].parentNode !== dst) need.push(take[n]);
		if (need.length) {
			var anchor = dst === cols && man ? man.nextSibling : null;
			var old = mqKids(dst);
			for (var j = 0; j < old.length; j++) {
				if (take.indexOf(old[j]) < 0) dst.removeChild(old[j]);
			}
			for (var m = 0; m < need.length; m++) {
				need[m].setAttribute('data-dol', need[m].classList.contains('mannequin-buttons') ? 'mq-buttons' : 'mq-right');
				dst.insertBefore(need[m], anchor);
			}
		} else if (fresh.length) {

			for (var o2 = 0; o2 < others.length; o2++) {
				var relics = mqKids(others[o2]);
				for (var r = 0; r < relics.length; r++) relics[r].parentNode.removeChild(relics[r]);
			}
		}
		genderTextRow(det, man, dst);
	}










	function genderTextRow(det, man, dst) {
		var host = isNarrow() ? dst.querySelector('.mannequin-buttons') : man;
		if (!host) return;
		var all = det.querySelectorAll('.mannequin-gender-textbutton');
		if (!all.length) return;
		var fresh = null;
		var rest = [];
		for (var i = 0; i < all.length; i++) {
			if (!fresh && all[i].parentElement === man) fresh = all[i];
			else rest.push(all[i]);
		}
		var keep = fresh || rest.shift();
		for (var r = 0; r < rest.length; r++) if (rest[r].parentNode) rest[r].parentNode.removeChild(rest[r]);
		if (keep.parentElement !== host) host.appendChild(keep);
	}















	function shopTryRow(det) {
		var bar = barOf();




		var row = det.querySelector('.try-buttons') || (bar ? childByClass(bar, 'try-buttons') : null);
		if (!row) return;
		var host = childByClass(det, 'clothing-colours-div');
		if (!host) return;
		var narrow = isNarrow();
		var wantIdx = host.children.length;
		var pinned = !narrow;
		if (narrow) {
			for (var i = 0; i < host.children.length; i++) {
				var k = host.children[i];
				if (k.classList && (k.classList.contains('mannequin-buttons') || k.classList.contains('mannequin-buttons-right'))) {
					wantIdx = i + 1; pinned = true;
				}
			}
			if (!pinned) {
				for (var j = 0; j < host.children.length; j++) {
					if (host.children[j].classList && host.children[j].classList.contains('mannequin')) {
						wantIdx = j + 1; pinned = true;
					}
				}
			}
		}
		var at = -1;
		for (var m = 0; m < host.children.length; m++) if (host.children[m] === row) at = m;
		if (row.parentElement === host) {
			if (!narrow) return;
			if (at === wantIdx) return;
		}
		var wantNode = wantIdx < host.children.length ? host.children[wantIdx] : null;
		var stale = childByClass(host, 'try-buttons');
		if (stale && stale !== row) host.removeChild(stale);
		if (bar) {
			var inBar = childByClass(bar, 'try-buttons');
			if (inBar && inBar !== row) bar.removeChild(inBar);
		}
		host.insertBefore(row, wantNode);
	}







	function shopClearHome() {
		var list = DOC.getElementById('clothes-list');
		var bar = barOf();
		var group = list ? searchGroup(list) : null;
		if (!bar || !group) return;
		var move = childByMark(bar, 'bar-clear') || childByMark(group, 'bar-clear');
		if (!move) return;
		var dst = isNarrow() || !childByClass(bar, 'buy-buttons') ? group : bar;
		if (move.parentElement === dst) return;
		if (move.parentNode) move.parentNode.removeChild(move);
		if (dst === bar) bar.insertBefore(move, bar.firstChild); else group.appendChild(move);
	}







	function shopCartBlock(det, s) {
		if (!s.hasBuy) return;
		var box = make('div', 'dol-shop-cart', 'shop-cart');
		var head = DOC.createElement('div');
		head.className = 'dol-cart-head';
		head.textContent = '本次购买';
		box.appendChild(head);
		det.appendChild(box);
		cartBox = box;
		if (shopPick) {
			var nm = DOC.createElement('div');
			nm.className = 'dol-cart-name';
			nm.setAttribute('data-dol', 'cart-name');
			nm.textContent = shopPick;
			box.appendChild(nm);
		}
		cartRow(box, 'cart-unit', '单价', s.unit);
		cartRow(box, 'cart-qty', '件数', s.qty ? '×' + s.qty : '');
		cartRow(box, 'cart-total', '合计', s.total);
		var note = DOC.createElement('div');
		note.className = 'dol-cart-note';
		note.setAttribute('data-dol', 'cart-note');
		note.textContent = '现金或衣柜空间不够';
		note.hidden = !s.blocked;
		box.appendChild(note);
	}








	var cartBar = null;

	function shopCartBar(bar, s) {
		var buy = childByClass(bar, 'buy-buttons');
		var box = childByMark(bar, 'cart-bar');
		if (!s.hasBuy) {
			if (box) bar.removeChild(box);
			cartBar = null;
			return;
		}
		if (!box) {
			box = make('div', 'dol-cart-bar', 'cart-bar');
			bar.insertBefore(box, buy);
			cartRow(box, 'cart-unit', '单价', s.unit);
			cartRow(box, 'cart-qty', '件数', s.qty ? '×' + s.qty : '');
			cartRow(box, 'cart-total', '合计', s.total);
			var note = DOC.createElement('span');
			note.className = 'dol-cart-note';
			note.setAttribute('data-dol', 'cart-note');
			note.textContent = '现金或衣柜空间不够';
			note.hidden = !s.blocked;
			box.appendChild(note);
		}
		cartBar = box;
		syncCart(box, s);
	}





	function onBuySlider(ev) {
		var t = ev.target;
		if (!t || !t.closest || !t.closest('#buy-multiple-slider')) return;
		window.setTimeout(cartSync, 0);
	}

	function syncCart(box, s) {
		cartWrite(box, 'cart-unit', s.unit);
		cartWrite(box, 'cart-qty', s.qty ? '×' + s.qty : '');
		cartWrite(box, 'cart-total', s.total);
		var note = childByMark(box, 'cart-note');
		if (note) note.hidden = !s.blocked;
	}

	function cartSync() {
		var s = cartSources();
		if (cartBox && cartBox.parentNode) syncCart(cartBox, s);
		if (cartBar && cartBar.parentNode) syncCart(cartBar, s);
	}









	function paintAlt(btn, kd) {
		var folded = kd.getAttribute('data-dol-alt') === '0';
		var text = folded ? '展开' : '收起';
		if (btn.textContent !== text) btn.textContent = text;
		var hid = !DOC.getElementById('altSection');
		if (btn.hidden !== hid) btn.hidden = hid;
	}

	function kitchenAltToggle() {
		var kd = DOC.getElementById('kitchenDisplay');
		var search = DOC.getElementById('search');
		if (!kd || !search) return;
		var btn = search.querySelector('[data-dol="alt-toggle"]');
		if (!btn) {
			btn = make('button', 'dol-alt-toggle', 'alt-toggle');
			btn.type = 'button';
			search.appendChild(btn);
			btn.addEventListener('click', function () {
				kd.setAttribute('data-dol-alt', kd.getAttribute('data-dol-alt') === '0' ? '1' : '0');
				paintAlt(btn, kd);
			});
		}
		paintAlt(btn, kd);
	}

























	function dropPipes(box) {
		for (var n = box.firstChild, next; n; n = next) {
			next = n.nextSibling;
			if (n.nodeType === 3 && /^\s*\|\s*$/.test(n.nodeValue)) box.removeChild(n);
		}
	}

	function wardrobeToolbar() {
		var pc = DOC.getElementById('passage-content');
		var links = DOC.getElementById('wardrobeLinks');
		if (!pc || !links) return;


		var inPc = typeof pc.contains === 'function' ? pc.contains(links) : links.parentNode === pc;
		if (!inPc) return;
		var bar = null;
		for (var c = pc.firstElementChild, nxt; c; c = nxt) {
			nxt = c.nextElementSibling;
			if (isMine(c) || !c.classList) continue;
			if (!c.classList.contains('wardrobe-action') || c.classList.contains('wardrobeItem')) continue;
			if (!bar) { bar = make('div', 'dol-wbar', 'wbar'); pc.insertBefore(bar, c); }
			bar.appendChild(c);
		}
		dropPipes(pc);
		var flexed = [links, DOC.getElementById('wardrobeList'), DOC.getElementById('listoutfits')];
		for (var i = 0; i < flexed.length; i++) { if (flexed[i]) dropPipes(flexed[i]); }
	}







	function wardrobeSortFold() {
		var list = DOC.getElementById('wardrobeList');
		if (!list) return;


		for (var tn = list.childNodes.length - 1; tn >= 0; tn--) {
			var nd = list.childNodes[tn];
			if (nd.nodeType === 3 && /^\s*(排序|反向排序)\s*[:：]?\s*$/.test(nd.nodeValue || '')) list.removeChild(nd);
		}


		var oldEq = list.querySelector('.dol-wbreak[data-for="eq"]');
		var eqText = null;
		for (var ei = 0; ei < list.childNodes.length; ei++) {
			var en = list.childNodes[ei];
			if (en.nodeType === 3 && (en.nodeValue || '').indexOf('已装备物品') >= 0) { eqText = en; break; }
		}
		if (eqText && !(oldEq && oldEq.nextSibling === eqText)) {
			if (oldEq) oldEq.parentNode.removeChild(oldEq);
			var wb = DOC.createElement('div');
			wb.className = 'dol-wbreak';
			wb.setAttribute('data-for', 'eq');
			list.insertBefore(wb, eqText);
		}
		var oldFold = list.querySelector('.dol-sortfold');
		var oldBtn = list.querySelector('.dol-sorttoggle');
		if (oldFold) {
			var loose = 0;
			for (var c0 = list.firstElementChild; c0; c0 = c0.nextElementSibling) {
				if (c0 === oldFold || c0 === oldBtn) continue;
				if (c0.classList && c0.classList.contains('wardrobe-action') && !c0.classList.contains('wardrobeItem')) loose++;
			}

			if (oldFold.querySelectorAll('.wardrobe-action').length >= 4 && loose === 0) return;
			var grps0 = oldFold.querySelectorAll('.dol-sortgrp');
			for (var g0 = 0; g0 < grps0.length; g0++) {
				while (grps0[g0].firstElementChild) list.insertBefore(grps0[g0].firstElementChild, oldFold);
			}
			while (oldFold.firstElementChild) list.insertBefore(oldFold.firstElementChild, oldFold);
			oldFold.parentNode.removeChild(oldFold);
		}
		if (oldBtn) oldBtn.parentNode.removeChild(oldBtn);

		var acts = [];
		for (var c = list.firstElementChild; c; c = c.nextElementSibling) {


			if (c.classList && c.classList.contains('wardrobeItem')) break;
			if (c.classList && c.classList.contains('wardrobe-action') && !c.classList.contains('wardrobeItem')) acts.push(c);
		}
		if (acts.length < 4) return;


		var seen = {}, cut = acts.length;
		for (var i = 0; i < acts.length; i++) {
			var t = (acts[i].textContent || '').trim();
			if (!t) continue;
			if (seen[t]) { cut = i; break; }
			seen[t] = 1;
		}

		var fold = DOC.createElement('div');
		fold.className = 'dol-sortfold';
		var btn = DOC.createElement('button');
		btn.type = 'button';
		btn.className = 'dol-sorttoggle';
		btn.textContent = '排序 ▾';
		btn.onclick = function () {
			var open = fold.classList.toggle('open');
			btn.textContent = open ? '排序 ▴' : '排序 ▾';
		};

		list.insertBefore(btn, acts[0]);
		list.insertBefore(fold, acts[0]);
		var asc = DOC.createElement('div');
		asc.className = 'dol-sortgrp';
		for (var k = 0; k < cut; k++) asc.appendChild(acts[k]);
		fold.appendChild(asc);
		if (cut < acts.length) {

			var dsc = DOC.createElement('div');
			dsc.className = 'dol-sortgrp';
			dsc.classList.add('dol-sortgrp--off');
			for (var m = cut; m < acts.length; m++) dsc.appendChild(acts[m]);
			fold.appendChild(dsc);
		}
	}

	function wardrobeMetaWrap() {
		var list = DOC.getElementById('wardrobeList');
		if (!list) return;
		var items = list.querySelectorAll('.wardrobeItem');
		for (var i = 0; i < items.length; i++) {
			var it = items[i];
			var has = false;
			for (var q = it.firstElementChild; q; q = q.nextElementSibling) {
				if (q.classList && q.classList.contains('dol-wmeta')) { has = true; break; }
			}
			if (has) continue;
			var a = null;
			for (var c = it.firstElementChild; c; c = c.nextElementSibling) {
				if (c.tagName === 'A') { a = c; break; }
			}
			if (!a) continue;

			var hasMeta = false;
			for (var n = a.nextSibling; n; n = n.nextSibling) {
				if (n.nodeType === 1) { hasMeta = true; break; }
				if (n.nodeType === 3 && /\S/.test(n.nodeValue || '')) { hasMeta = true; break; }
			}
			if (!hasMeta) continue;


			var meta = DOC.createElement('span');
			meta.className = 'dol-wmeta';
			while (a.nextSibling) meta.appendChild(a.nextSibling);
			it.appendChild(meta);
		}
	}

	function wardrobeTabsNav() {
		var links = DOC.getElementById('wardrobeLinks');
		if (!links || !links.parentNode) return;
		var wrap = links.parentNode;
		if (!wrap.classList || !wrap.classList.contains('dol-tabwrap')) {
			wrap = DOC.createElement('div');
			wrap.className = 'dol-tabwrap';
			links.parentNode.insertBefore(wrap, links);
			wrap.appendChild(links);
			var mk = function (cls, txt) {
				var b = DOC.createElement('button');
				b.type = 'button';
				b.className = 'dol-tabnav' + (cls === 'prev' ? ' prev' : ' next');
				b.textContent = txt;
				return b;
			};
			wrap.insertBefore(mk('prev', '‹'), links);
			wrap.appendChild(mk('next', '›'));
		}
		var prev = wrap.querySelector('.dol-tabnav.prev');
		var next = wrap.querySelector('.dol-tabnav.next');
		if (!prev || !next) return;
		var sync = function () {
			var max = links.scrollWidth - links.clientWidth;
			prev.disabled = links.scrollLeft <= 1;
			next.disabled = links.scrollLeft >= max - 1;
		};
		prev.onclick = function () { links.scrollLeft -= 170; setTimeout(sync, 60); };
		next.onclick = function () { links.scrollLeft += 170; setTimeout(sync, 60); };
		if (!prev.getAttribute('data-dol-bound')) {
			links.addEventListener('scroll', sync);
			prev.setAttribute('data-dol-bound', '1');
		}
		setTimeout(sync, 0);
	}
















	var scheduled = false;
	function run() {
		if (scheduled) return;
		scheduled = true;
		var done = false;
		function flush() {
			if (done) return;
			done = true;
			scheduled = false;
			try { groupCaption(); } catch (e) { console.error('[dol-ui] 侧栏骨架失败（不影响游戏）', e); }
			try { groupLinks(); } catch (e) { console.error('[dol-ui] 链接骨架失败（不影响游戏）', e); }
			try { shopCategoryLabels(); } catch (e) { console.error('[dol-ui] 商店页签骨架失败（不影响游戏）', e); }
			try { shopStripNavs(); } catch (e) { console.error('[dol-ui] 横滑条翻页钮失败（不影响游戏）', e); }


			try { shopReflow(); } catch (e) { console.error('[dol-ui] 商店四层落位失败（不影响游戏）', e); }
			try { shopDetailTitle(); } catch (e) { console.error('[dol-ui] 商店标题骨架失败（不影响游戏）', e); }




			var detNow = DOC.querySelector('.clothing-details');
			try { if (detNow) shopMannequinRow(detNow); } catch (e) { console.error('[dol-ui] 性别行两簇落位失败（不影响游戏）', e); }
			try { if (detNow) shopTryRow(detNow); } catch (e) { console.error('[dol-ui] 试穿行落位失败（不影响游戏）', e); }
			try { shopClearHome(); } catch (e) { console.error('[dol-ui] 清空钮归位失败（不影响游戏）', e); }
			try { kitchenAltToggle(); } catch (e) { console.error('[dol-ui] 厨房收起按钮失败（不影响游戏）', e); }
			try { wardrobeToolbar(); } catch (e) { console.error('[dol-ui] 衣柜动作条失败（不影响游戏）', e); }
			try { wardrobeSortFold(); } catch (e) { console.error('[dol-ui] 衣柜排序折叠失败（不影响游戏）', e); }
			try { wardrobeMetaWrap(); } catch (e) { console.error('[dol-ui] 衣柜元信息分组失败（不影响游戏）', e); }
			try { wardrobeTabsNav(); } catch (e) { console.error('[dol-ui] 衣柜页签翻页钮失败（不影响游戏）', e); }
		}
		if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(flush);
		else window.setTimeout(flush, 16);
		window.setTimeout(flush, 200);
	}

	function boot() {
		run();


		if (typeof window.jQuery === 'function') {
			window.jQuery(DOC).on(':passagedisplay.' + NS, run);
		}



		DOC.addEventListener('click', onShopClick, true);





		if (NARROW) {
			var onTier = function () { run(); };
			if (NARROW.addEventListener) NARROW.addEventListener('change', onTier);
			else if (NARROW.addListener) NARROW.addListener(onTier);
		}


		DOC.addEventListener('input', onBuySlider, false);



		if (typeof window.MutationObserver === 'function') {
			var watch = DOC.getElementById('story') || DOC.body;
			new window.MutationObserver(function (list) {
				for (var i = 0; i < list.length; i++) {
					if (list[i].addedNodes && list[i].addedNodes.length) { run(); return; }
				}
			}).observe(watch, { childList: true, subtree: true });
		}
	}

	if (DOC.readyState === 'loading') DOC.addEventListener('DOMContentLoaded', boot);
	else boot();
})();
