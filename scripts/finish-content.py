"""Finish incomplete legacy documentation entry points using available content."""
from pathlib import Path
root = Path(__file__).resolve().parents[1] / 'public'
beacon = '<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon=\'{"token":"3d9e2f7ead2a4e07ad8644dfcd7ce66f"}\'></script>'
articles = {
    'Multiple-Windows': 'Multiple windows',
    'Multiple-Windows-Input': 'Multiple-window input',
    'OpenFL-Defines': 'OpenFL defines',
    'Sys_Error': 'Sys_Error',
    'gen_js_Assertion_Failed': 'JavaScript assertion errors',
    'Vision': 'Vision',
}
links = ''.join(f'<li><a href="./?name={name}">{title}</a></li>' for name, title in articles.items())
intro = '''<h1>Little</h1>
<p>Little is a programming language with customizable keywords and built-in types.</p>
<p>Start with the <a href="/little/guides/">getting-started guide</a>, experiment in the <a href="/little/demo/">playground</a>, or read the <a href="https://github.com/ShaharMS/Little#readme">project reference</a>.</p>
<p>The guide and playground cover language syntax and customizable keywords. Additional examples are available in the project reference.</p>
<p>Explore the Haxe articles in the sidebar.</p>'''
page = '''<!doctype html>
<html lang="en" class="dark-theme"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" href="data:,"><title>Little Documentation | Shahar</title>
<link href="./bootstrap/css/bootstrap.min.css" rel="stylesheet">
<link href="./bootstrap/css/bootstrap-responsive.min.css" rel="stylesheet">
<link href="./styles.css" rel="stylesheet"><link href="./haxe-nav.css" rel="stylesheet">
<link href="./dark-mode.css" rel="stylesheet">
<style>body{padding-top:1rem}.navbar .brand{text-shadow:none}.main-content{padding:1rem 5vw}pre{color:#ddd;background:#222}</style>
</head><body>
<nav class="navbar"><div class="navbar-inner"><a class="brand" href="/">Shahar</a><a class="brand" href="./">Little Documentation</a><a class="brand" href="/little/demo/">Playground</a></div></nav>
<div class="container-fluid main-content"><div class="row-fluid">
<aside class="span3"><div class="well sidebar-nav"><ul class="nav nav-list">
<li><a href="./">Overview</a></li><li><a href="/little/guides/">Getting started</a></li>
<li><a href="/little/demo/">Try Little online</a></li>
<li><a href="https://github.com/ShaharMS/Little#readme">Language source and reference ↗</a></li>
<li class="nav-header">Haxe articles</li>__LINKS__
</ul></div></aside><main class="span9" id="article-body">__INTRO__</main></div></div>
<script>
const name = new URLSearchParams(location.search).get('name');
const articles = __ARTICLES__;
if (articles.includes(name)) {
  fetch('./pages/' + name + '.html').then(response => {
    if (!response.ok) throw new Error('Article unavailable');
    return response.text();
  }).then(text => { document.getElementById('article-body').innerHTML = text; }).catch(() => {
    document.getElementById('article-body').textContent = 'This article could not be loaded. Please try again.';
  });
}
</script>__BEACON__</body></html>'''
import json
page = page.replace('__LINKS__', links).replace('__INTRO__', intro).replace('__ARTICLES__', json.dumps(list(articles))).replace('__BEACON__', beacon)
(root / 'little/doc/index.html').write_text(page, encoding='utf-8')
(root / 'little/doc/pages/index.html').write_text(intro, encoding='utf-8')
(root / 'little/doc/pages/Vision.html').write_text('''<h1>Vision</h1>
<p>Vision is a cross-platform computer vision and image manipulation library for Haxe.</p>
<p>Read the <a href="/vision/docs/2.0.0-beta/vision/Vision.html">Vision API reference</a>, explore the <a href="/vision/docs/2.0.0-beta/vision/ds/Image.html">Image type</a>, or visit the <a href="https://github.com/ShaharMS/Vision">source repository</a>.</p>''', encoding='utf-8')
