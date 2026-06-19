### ***Bookmarklet***
```javascript
javascript:(function(){fetch("https://raw.githubusercontent.com/Alex236508/Math-Lab/refs/heads/main/Calculator.js").then(function(a){if(!a.ok)throw new Error(a.status);return a.text()}).then(function(a){var c=new Blob([a],{type:"application/javascript"}),b=URL.createObjectURL(c),d=document.createElement("script");d.src=b;(document.head||document.documentElement).appendChild(d)})})();
