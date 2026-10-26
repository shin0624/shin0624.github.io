/* =============================================================================
   Beomsu Shin — Developer Profile
   1) 모바일 메뉴  2) 스크롤 스파이  3) 등장 모션  4) 숫자/바 애니메이션
   5) 개발 전 주기 탭  6) 프로젝트 탭  7) 관심 분야 노드 그래프
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- 1. 메뉴 */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('mainNav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ------------------------------------------------------- 2. 스크롤 스파이 */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav a[href^="#"]'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------------------------------------------------------- 3. 등장 모션 */
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (!('IntersectionObserver' in window) || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        obs.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    reveals.forEach(function (el) { revObs.observe(el); });

    /* 관찰자만으로는 부족한 경우를 받칩니다.
       앵커 링크로 건너뛰거나 스크롤이 한 번에 크게 움직이면 교차 콜백이
       합쳐지면서 누락될 수 있고, 그러면 섹션이 투명한 채로 남습니다. */
    var queued = false;
    function sweep() {
      queued = false;
      var vh = window.innerHeight || 0;
      for (var i = reveals.length - 1; i >= 0; i--) {
        var el = reveals[i];
        if (el.classList.contains('is-in')) { reveals.splice(i, 1); continue; }
        var top = el.getBoundingClientRect().top;
        if (top < vh * .95) {
          el.classList.add('is-in');
          revObs.unobserve(el);
          reveals.splice(i, 1);
        }
      }
      if (!reveals.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    }
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sweep);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', onScroll);
    onScroll();
  }

  /* ------------------------------------------------ 4. 숫자 · 스킬바 애니메이션 */
  function runCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }

    var dur = 1000, t0 = null;
    function tick(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + (p === 1 ? suffix : '');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(tick);
  }

  function watchOnce(selector, action) {
    var els = document.querySelectorAll(selector);
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, action);
      return;
    }
    var obs = new IntersectionObserver(function (entries, o) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        action(en.target);
        o.unobserve(en.target);
      });
    }, { threshold: .4 });
    Array.prototype.forEach.call(els, function (el) { obs.observe(el); });
  }

  watchOnce('.hero-stats b[data-count]', runCounter);
  watchOnce('.bar-fill', function (el) {
    el.style.width = (el.getAttribute('data-level') || 0) + '%';
  });

  /* ------------------------------------------------------------- 5~6. 탭 */
  function setupTabs(tabSelector) {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(tabSelector));
    if (!tabs.length) return;

    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        var next = tabs[(i + dir + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  }

  setupTabs('.lc-step');
  setupTabs('.proj-tab');

  /* ------------------------------------------------ 7. 관심 분야 노드 그래프 */
  var svg = document.getElementById('graphSvg');
  var stage = document.getElementById('graphStage');
  var infoBox = document.getElementById('graphInfo');
  var legendBox = document.getElementById('graphLegend');

  if (svg && stage) {
    var NS = 'http://www.w3.org/2000/svg';

    var CATS = {
      core: { name: '중심',             color: '#4fd6ff' },
      xr:   { name: '콘텐츠 개발',   color: '#2f8cff' },
      ai:   { name: 'AI 개발',        color: '#4fd6ff' },
      dt:   { name: '디지털 트윈',       color: '#ffb04d' },
      be:   { name: '백엔드 · 플랫폼',   color: '#a98bff' }
      /* em:   { name: '임베디드 · 센싱',   color: '#4fe0b4' } */
    };

    var NODES = [
      { id: 'me', label: 'Shin Beom Su', cat: 'core', r: 22, kind: 'root',
        desc: '3D, AI, 멀티모달, 산업 분야, 컨텐츠 개발에 관심이 있습니다.' },

      /* XR · 실시간 3D */
      { id: 'xr',   label: '3D · XR', cat: 'xr', r: 15, kind: 'hub',
        desc: '게임에서 시작하여 AI 기반 인터랙티브 콘텐츠, XR 시뮬레이션, 디지털 트윈으로 넓히고 있습니다.' },
      { id: 'unity', label: 'Unity Engine', cat: 'xr', r: 11,
        desc: '가장 자신있는 기술 스택입니다. 게임, 시뮬레이션, 디지털 트윈까지 모두 Unity로 만듭니다.' },
      { id: 'hmd', label: 'XR', cat: 'xr', r: 10,
        desc: 'Meta Quest 2 기반 수술실 시뮬레이션과 다중 접속 동기화를 개발하였습니다.' },
      { id: 'blender', label: 'Blender', cat: 'xr', r: 9,
        desc: '사용할 에셋의 모델링, 리깅, 최적화에 사용합니다. 최근에는 Claude MCP를 통해 에셋 생성 자동화 시스템을 구축하고 있습니다.' },
      { id: 'game', label: 'Image To 3D', cat: 'xr', r: 10,
        desc: 'Meshy AI, TRELLIS, Hunyuan3D, VARCO 3D 등 에셋 생성 자동화 AI를 활발하게 사용 중입니다.' },
      { id: 'tool', label: 'Editor 도구', cat: 'xr', r: 9,
        desc: '반복 작업이 보이면 CustomEditor 도구로 만듭니다. 사운드 에셋 탐색, 계층구조 설정 자동화 도구를 만들고 출시한 경험이 있습니다.' },

      /* Vision AI */
      { id: 'ai', label: 'Vision AI', cat: 'ai', r: 15, kind: 'hub',
        desc: '영상에서 사람과 사물을 읽어내는 기술은 산업 현장에서 가장 수요가 많았기에, 다양한 모델을 개발에 사용 중입니다. ' },
      { id: 'det', label: 'Object Detection', cat: 'ai', r: 11,
        desc: '라이선스 이슈 방지가 필요한 상용 SW에는 주로 RT-DETR 계열을 사용하며, 비상업적 연구에는 YOLO 계열을 주로 사용합니다.' },
      { id: 'pose', label: 'Pose Estimation', cat: 'ai', r: 11,
        desc: '핸드 트래킹에는 주로 MediaPipe, 전신에 대한 고수준 추정 및 3D 아바타 개발 등에는 MoveNet 계열과 ViTPose를 주로 사용합니다.' },
      { id: 'seg', label: 'Segmentation', cat: 'ai', r: 10,
        desc: 'DeepLabV3+, Segformer 모델을 공공 데이터로 학습시켜 교량 이미지 내 결함의 픽셀 마스크를 그려 위치와 면적을 산정하는 기능을 Unity 내에서 구현하였습니다.' },
      { id: 'action', label: 'Action Segmentation', cat: 'ai', r: 10,
        desc: '동영상의 특징 벡터를 추출하여 학습시킨 TCN 계열 모델을 사용하여 연속된 영상 내 공정 분석을 수행하는 기술을 개발하였습니다.' },
      { id: 'onnx', label: 'Unity Sentis', cat: 'ai', r: 10,
        desc: '학습한 AI 모델을 ONNX로 변환해 Unity 내에서 추론시키는 Sentis Worker를 구현하여, Unity라는 엔진 내에서도 AI 모델 활용성이 높음을 검증하였습니다.' },
      { id: 'autolabel', label: '라벨링 자동화', cat: 'ai', r: 9,
        desc: 'Ollama 클라이언트와 gRPC, FFmpeg·OpenCV 등을 통해 정형/비정형 학습 데이터 전처리를 자동화 하는 툴을 개발하였습니다. 이를 통해 데이터 전처리 외주에 비용을 들이지 않게 되었습니다.' },

      /* 디지털 트윈 */
      { id: 'dt', label: '디지털 트윈', cat: 'dt', r: 15, kind: 'hub',
        desc: 'RGB · LiDAR 등을 사용하여 현실 설비를 3D로 옮기고 산업용 프로토콜로 데이터를 송수신 할 수 있습니다.' },
      { id: 'cesium', label: 'GIS', cat: 'dt', r: 10,
        desc: 'Cesium for Unity SDK를 사용하여 실제 국내 지형 위에 3D 설비 에셋를 얹거나, 공공 국토 데이터를 사용하여 대시보드 위에 클릭된 좌표의 도로명주소 정보를 표시할 수 있습니다. ' },
      { id: 'sim', label: '시뮬레이션', cat: 'dt', r: 10,
        desc: '현재 상태에서 조건을 바꿔가며 미래 데이터를 시뮬레이션 합니다. 정형 데이터의 시뮬레이션, 비정형 데이터의 시뮬레이션 모두 경험하였습니다.' },
      { id: 'mes', label: '현장 설비 연계', cat: 'dt', r: 10,
        desc: '산업 현장 MES, ERP, DataLake 등을 REST API로 연동하고, OPC UA, ModBus, MQTT, TCP 등으로 설비 데이터를 송수신/시각화 할 수 있습니다.' },
      { id: 'monitor', label: '모니터링', cat: 'dt', r: 10,
        desc: '실시간 상태의 시각화 및 사용자 I/O를 통한 데이터 송수신이 가능한 대시보드를 Blazor · Unity · TypeScript 등으로 개발하였습니다.' },
      { id: 'mlagents', label: 'ML-Agents', cat: 'dt', r: 9,
        desc: 'Unity 기반 시뮬레이션 환경 안에서 3D 에이전트 객체를 강화학습 시키는 환경을 개발하였습니다. ' },

      /* 백엔드 · 플랫폼 */
      { id: 'be', label: '백엔드 · 플랫폼', cat: 'be', r: 15, kind: 'hub',
        desc: '클라이언트만으로는 끝나지 않습니다. 데이터를 받고 저장하고 내보내는 쪽도 직접 만듭니다.' },
      { id: 'aspnet', label: '.NET', cat: 'be', r: 11,
        desc: 'C# 하나로 클라이언트와 서버를 함께 가져갈 수 있습니다. Blazor와 EF Core를 함께 사용하여 실제 현장에 적용하는 웹 앱을 개발하였습니다.' },
      { id: 'pg', label: 'Database', cat: 'be', r: 10,
        desc: '정형 데이터 뿐만 아니라 JSON, 배열, 시계열 등 다양한 데이터를 저장하고 꺼내 쓸 수 있습니다. 주로 PostgreSQL, SQLite, Firebase를 사용하며, MS-SQL, Influx DB 기반 시스템도 구축한 경험이 있습니다.' },
      { id: 'proto', label: '산업용 프로토콜', cat: 'be', r: 10,
        desc: '센서 데이터 수집, 설비 연동 등을 위한 OPC UA, ModBus, MQTT, TCP Socket 등 현장에서 주로 쓰이는 산업용 프로토콜 기반 개발이 가능합니다.' },
      { id: 'cloud', label: '영상 데이터 처리', cat: 'be', r: 9,
        desc: 'WebSocket, WebRTC, RTSP 등을 통해 영상 데이터를 웹 기반 SW에 실시간 송수신하는 기능을 개발하였습니다. 최근에는 4족보행 로봇의 카메라와 SW를 RTSP로 연결하고 gRPC로 고수준 제어를 수행하는 기술을 개발하고 있습니다.' }

      /* 임베디드 · 센싱 */
      /*
      { id: 'em', label: '임베디드 · 센싱', cat: 'em', r: 15, kind: 'hub',
        desc: '데이터가 처음 만들어지는 지점. 센서를 직접 다뤄봐야 뒷단 설계가 달라집니다.' },
      { id: 'edge', label: 'Edge Device', cat: 'em', r: 10,
        desc: 'MCU에서 신체 상황인지와 이상상태 판단 알고리즘을 개발했습니다.' },
      { id: 'multi', label: '멀티모달 센싱', cat: 'em', r: 10,
        desc: '서로 다른 종류의 신호를 묶어 하나의 상태로 읽어내는 작업입니다. 주로 심박, 산소포화도, 3축 가속도 등 생체신호를 다루었습니다.' },
      { id: 'mocap', label: '모션캡쳐', cat: 'em', r: 10,
        desc: 'Optitrack, XSENS MVN, Manus Glove를 운용해 3D Pose 데이터를 취득하고 Unity로 가져와 개발한 경험이 있습니다. 센서 HW 및 인프라 세팅이 가능하며, 직접 슈트를 입고 데이터를 생성하기도 합니다.' },
      { id: 'arduino', label: 'nRF, DFU', cat: 'em', r: 9,
        desc: 'OTA(On The Air) 기반 무선 펌웨어 업데이트 환경 구축이 가능합니다.' }
      */
    ];

    var LINKS = [
      /* 중심 → 허브 */
      ['me','xr'], ['me','ai'], ['me','dt'], ['me','be'], /* ['me','em'], */
      /* 허브 → 잎 */
      ['xr','unity'], ['xr','hmd'], ['xr','blender'], ['xr','game'], ['xr','tool'],
      ['ai','det'], ['ai','pose'], ['ai','seg'], ['ai','action'], ['ai','onnx'], ['ai','autolabel'],
      ['dt','cesium'], ['dt','sim'], ['dt','mes'], ['dt','monitor'], ['dt','mlagents'],
      ['be','aspnet'], ['be','pg'], ['be','proto'], ['be','cloud'],
      /* ['em','edge'], ['em','multi'], ['em','mocap'], ['em','arduino'], */
      /* 분야를 가로지르는 연결 */
      ['unity','onnx'], ['unity','cesium'], ['unity','mlagents'], ['unity','game'],
      ['onnx','det'], ['onnx','seg'],
      /* ['pose','mocap'], */ ['pose','monitor'],
      ['hmd','sim'],
      /* ['multi','monitor'], */ ['proto','monitor'], /* ['proto','edge'], */
      ['autolabel','proto'], ['mes','pg'], ['aspnet','sim'], ['tool','game']
    ];

    /* --- 자료 구조 준비 --- */
    var byId = {};
    NODES.forEach(function (n) {
      n.x = 0; n.y = 0; n.vx = 0; n.vy = 0;
      n.color = CATS[n.cat].color;
      n.nbr = {};
      byId[n.id] = n;
    });

    var edges = LINKS.map(function (l) {
      var s = byId[l[0]], t = byId[l[1]];
      s.nbr[t.id] = true; t.nbr[s.id] = true;
      var len = (s.kind === 'root' || t.kind === 'root') ? 130
              : (s.kind === 'hub' && t.kind === 'hub') ? 150
              : (s.kind === 'hub' || t.kind === 'hub') ? 78 : 104;
      return { s: s, t: t, len: len };
    });

    /* 초기 배치: 허브를 원형으로, 잎은 허브 주변에 */
    var hubs = NODES.filter(function (n) { return n.kind === 'hub'; });
    hubs.forEach(function (h, i) {
      var a = (i / hubs.length) * Math.PI * 2 - Math.PI / 2;
      h.x = Math.cos(a) * 150;
      h.y = Math.sin(a) * 130;
    });
    NODES.forEach(function (n) {
      if (n.kind) return;
      var parent = null;
      for (var k in n.nbr) { if (byId[k] && byId[k].kind === 'hub') { parent = byId[k]; break; } }
      var a = Math.random() * Math.PI * 2;
      n.x = (parent ? parent.x : 0) + Math.cos(a) * 60;
      n.y = (parent ? parent.y : 0) + Math.sin(a) * 60;
    });

    /* --- SVG 그리기 --- */
    var gLinks = document.createElementNS(NS, 'g');
    var gNodes = document.createElementNS(NS, 'g');
    svg.appendChild(gLinks);
    svg.appendChild(gNodes);

    edges.forEach(function (e) {
      e.el = document.createElementNS(NS, 'line');
      e.el.setAttribute('class', 'gl-link');
      gLinks.appendChild(e.el);
    });

    NODES.forEach(function (n) {
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'gl-node' + (n.kind ? ' is-' + n.kind : ''));
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', n.label);

      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('r', n.r);
      c.setAttribute('fill', n.color);
      c.style.color = n.color;

      var t = document.createElementNS(NS, 'text');
      t.setAttribute('dy', n.r + 13);
      t.textContent = n.label;

      g.appendChild(c);
      g.appendChild(t);
      gNodes.appendChild(g);
      n.el = g;
      n.circle = c;
    });

    /* --- 크기 --- */
    var W = 800, H = 460, cx = 400, cy = 230;
    function resize() {
      var rect = stage.getBoundingClientRect();
      W = Math.max(rect.width, 280);
      H = Math.max(rect.height, 300);
      cx = W / 2; cy = H / 2;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    }
    resize();
    window.addEventListener('resize', function () { resize(); kick(); });

    /* --- 물리 --- */
    var alpha = 1, dragged = null, running = false;

    function step() {
      var scale = Math.min(W, H) / 460;            // 좁은 화면에서는 전체를 모읍니다
      var i, j, a, b, dx, dy, d, f;

      /* 반발 */
      for (i = 0; i < NODES.length; i++) {
        a = NODES[i];
        for (j = i + 1; j < NODES.length; j++) {
          b = NODES[j];
          dx = b.x - a.x; dy = b.y - a.y;
          d = Math.sqrt(dx * dx + dy * dy) || .01;
          var minD = (a.r + b.r) * 2.1;
          f = (2400 * scale) / (d * d);
          if (d < minD) f += (minD - d) * .34;     // 겹침 방지
          var ux = dx / d, uy = dy / d;
          a.vx -= ux * f; a.vy -= uy * f;
          b.vx += ux * f; b.vy += uy * f;
        }
      }

      /* 링크 스프링 */
      edges.forEach(function (e) {
        dx = e.t.x - e.s.x; dy = e.t.y - e.s.y;
        d = Math.sqrt(dx * dx + dy * dy) || .01;
        var target = e.len * scale;
        f = (d - target) * .022;
        var ux = dx / d, uy = dy / d;
        e.s.vx += ux * f; e.s.vy += uy * f;
        e.t.vx -= ux * f; e.t.vy -= uy * f;
      });

      /* 중심 인력 + 적분 */
      NODES.forEach(function (n) {
        var pull = n.kind === 'root' ? .055 : .009;
        n.vx -= n.x * pull;
        n.vy -= n.y * pull;

        if (n === dragged) { n.vx = 0; n.vy = 0; return; }

        n.vx *= .82; n.vy *= .82;
        n.x += n.vx * alpha;
        n.y += n.vy * alpha;

        /* 화면 밖으로 나가지 않도록. 라벨이 원 바깥으로 나가므로
           좁은 화면에서는 여백을 더 크게 잡아 글자가 잘리지 않게 합니다. */
        var pad = W < 560 ? 46 : 24;
        var mx = W / 2 - n.r - pad, my = H / 2 - n.r - 24;
        n.x = Math.max(-mx, Math.min(mx, n.x));
        n.y = Math.max(-my, Math.min(my, n.y));
      });
    }

    function paint() {
      edges.forEach(function (e) {
        e.el.setAttribute('x1', cx + e.s.x);
        e.el.setAttribute('y1', cy + e.s.y);
        e.el.setAttribute('x2', cx + e.t.x);
        e.el.setAttribute('y2', cy + e.t.y);
      });
      NODES.forEach(function (n) {
        n.el.setAttribute('transform', 'translate(' + (cx + n.x) + ',' + (cy + n.y) + ')');
      });
    }

    function loop() {
      step();
      paint();
      alpha *= .994;
      if (alpha > .06 || dragged) requestAnimationFrame(loop);
      else running = false;
    }

    function kick(v) {
      alpha = Math.max(alpha, v || .7);
      if (!running) { running = true; requestAnimationFrame(loop); }
    }

    if (reduceMotion) {
      for (var s = 0; s < 400; s++) step();
      paint();
    } else {
      /* 보일 때 시작 */
      if ('IntersectionObserver' in window) {
        var gObs = new IntersectionObserver(function (en, o) {
          if (en[0].isIntersecting) { kick(1); o.disconnect(); }
        }, { threshold: .15 });
        gObs.observe(stage);
      } else { kick(1); }
      paint();
    }

    /* --- 강조 --- */
    function highlight(node) {
      NODES.forEach(function (n) {
        n.el.classList.remove('is-lit', 'is-dim');
      });
      edges.forEach(function (e) { e.el.classList.remove('is-lit', 'is-dim'); });
      if (!node) return;

      NODES.forEach(function (n) {
        if (n === node || n.nbr[node.id]) n.el.classList.add('is-lit');
        else n.el.classList.add('is-dim');
      });
      edges.forEach(function (e) {
        if (e.s === node || e.t === node) e.el.classList.add('is-lit');
        else e.el.classList.add('is-dim');
      });
    }

    function highlightCat(cat) {
      NODES.forEach(function (n) {
        n.el.classList.remove('is-lit', 'is-dim');
        if (n.cat === cat || n.kind === 'root') n.el.classList.add('is-lit');
        else n.el.classList.add('is-dim');
      });
      edges.forEach(function (e) {
        e.el.classList.remove('is-lit', 'is-dim');
        if (e.s.cat === cat && e.t.cat === cat) e.el.classList.add('is-lit');
        else e.el.classList.add('is-dim');
      });
    }

    /* --- 정보 패널 --- */
    function showInfo(node) {
      var cat = CATS[node.cat];
      var rel = Object.keys(node.nbr).map(function (id) { return byId[id]; }).filter(Boolean);

      var html = '';
      html += '<p class="gi-cat" style="color:' + cat.color + '">' + cat.name + '</p>';
      html += '<h3>' + node.label + '</h3>';
      html += '<p>' + node.desc + '</p>';
      if (rel.length) {
        html += '<div class="gi-rel"><strong>이어진 분야</strong><div class="tag-row">';
        rel.slice(0, 8).forEach(function (r) { html += '<span class="tag">' + r.label + '</span>'; });
        html += '</div></div>';
      }
      infoBox.innerHTML = html;
    }

    showInfo(byId.me);

    NODES.forEach(function (n) {
      n.el.addEventListener('mouseenter', function () { highlight(n); });
      n.el.addEventListener('mouseleave', function () { highlight(null); });
      n.el.addEventListener('focus', function () { highlight(n); showInfo(n); });
      n.el.addEventListener('click', function () { showInfo(n); highlight(n); });
      n.el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showInfo(n); highlight(n); }
      });
    });

    /* --- 드래그 --- */
    function toLocal(evt) {
      var rect = svg.getBoundingClientRect();
      return {
        x: (evt.clientX - rect.left) * (W / rect.width) - cx,
        y: (evt.clientY - rect.top) * (H / rect.height) - cy
      };
    }

    NODES.forEach(function (n) {
      n.el.addEventListener('pointerdown', function (evt) {
        dragged = n;
        n.el.setPointerCapture(evt.pointerId);
        kick(.55);
        evt.preventDefault();
      });
      n.el.addEventListener('pointermove', function (evt) {
        if (dragged !== n) return;
        var p = toLocal(evt);
        n.x = p.x; n.y = p.y;
        paint();
      });
      function release(evt) {
        if (dragged !== n) return;
        dragged = null;
        try { n.el.releasePointerCapture(evt.pointerId); } catch (err) {}
        kick(.5);
      }
      n.el.addEventListener('pointerup', release);
      n.el.addEventListener('pointercancel', release);
    });

    /* --- 범례 --- */
    if (legendBox) {
      var frag = document.createDocumentFragment();
      Object.keys(CATS).forEach(function (key) {
        if (key === 'core') return;
        var b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = '<i style="background:' + CATS[key].color + '"></i>' + CATS[key].name;
        b.addEventListener('mouseenter', function () { highlightCat(key); });
        b.addEventListener('mouseleave', function () { highlight(null); });
        b.addEventListener('click', function () {
          var hub = NODES.filter(function (n) { return n.cat === key && n.kind === 'hub'; })[0];
          if (hub) { showInfo(hub); highlight(hub); }
        });
        frag.appendChild(b);
      });
      legendBox.appendChild(frag);
    }

    /* 빈 곳을 누르면 강조 해제 */
    svg.addEventListener('click', function (e) {
      if (e.target === svg) { highlight(null); showInfo(byId.me); }
    });
  }
})();