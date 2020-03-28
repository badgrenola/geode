var app=function(){"use strict";function e(){}function t(e){return e()}function n(){return Object.create(null)}function r(e){e.forEach(t)}function o(e){return"function"==typeof e}function s(e,t){return e!=e?t==t:e!==t||e&&"object"==typeof e||"function"==typeof e}function l(e,t){e.appendChild(t)}function c(e,t,n){e.insertBefore(t,n||null)}function a(e){e.parentNode.removeChild(e)}function i(e){return document.createElement(e)}function u(e){return document.createTextNode(e)}function d(){return u(" ")}function f(e,t,n,r){return e.addEventListener(t,n,r),()=>e.removeEventListener(t,n,r)}function p(e,t,n){null==n?e.removeAttribute(t):e.getAttribute(t)!==n&&e.setAttribute(t,n)}function g(e,t){t=""+t,e.data!==t&&(e.data=t)}let m;function h(e){m=e}const x=[],$=[],y=[],b=[],w=Promise.resolve();let v=!1;function M(e){y.push(e)}let T=!1;const _=new Set;function k(){if(!T){T=!0;do{for(let e=0;e<x.length;e+=1){const t=x[e];h(t),F(t.$$)}for(x.length=0;$.length;)$.pop()();for(let e=0;e<y.length;e+=1){const t=y[e];_.has(t)||(_.add(t),t())}y.length=0}while(x.length);for(;b.length;)b.pop()();v=!1,T=!1,_.clear()}}function F(e){if(null!==e.fragment){e.update(),r(e.before_update);const t=e.dirty;e.dirty=[-1],e.fragment&&e.fragment.p(e.ctx,t),e.after_update.forEach(M)}}const E=new Set;function L(e,t){e&&e.i&&(E.delete(e),e.i(t))}function S(e,n,s){const{fragment:l,on_mount:c,on_destroy:a,after_update:i}=e.$$;l&&l.m(n,s),M(()=>{const n=c.map(t).filter(o);a?a.push(...n):r(n),e.$$.on_mount=[]}),i.forEach(M)}function C(e,t){const n=e.$$;null!==n.fragment&&(r(n.on_destroy),n.fragment&&n.fragment.d(t),n.on_destroy=n.fragment=null,n.ctx=[])}function j(e,t){-1===e.$$.dirty[0]&&(x.push(e),v||(v=!0,w.then(k)),e.$$.dirty.fill(0)),e.$$.dirty[t/31|0]|=1<<t%31}function A(t,o,s,l,c,i,u=[-1]){const d=m;h(t);const f=o.props||{},p=t.$$={fragment:null,ctx:null,props:i,update:e,not_equal:c,bound:n(),on_mount:[],on_destroy:[],before_update:[],after_update:[],context:new Map(d?d.$$.context:[]),callbacks:n(),dirty:u};let g=!1;if(p.ctx=s?s(t,f,(e,n,...r)=>{const o=r.length?r[0]:n;return p.ctx&&c(p.ctx[e],p.ctx[e]=o)&&(p.bound[e]&&p.bound[e](o),g&&j(t,e)),n}):[],p.update(),g=!0,r(p.before_update),p.fragment=!!l&&l(p.ctx),o.target){if(o.hydrate){const e=function(e){return Array.from(e.childNodes)}(o.target);p.fragment&&p.fragment.l(e),e.forEach(a)}else p.fragment&&p.fragment.c();o.intro&&L(t.$$.fragment),S(t,o.target,o.anchor),k()}h(d)}class N{$destroy(){C(this,1),this.$destroy=e}$on(e,t){const n=this.$$.callbacks[e]||(this.$$.callbacks[e]=[]);return n.push(t),()=>{const e=n.indexOf(t);-1!==e&&n.splice(e,1)}}$set(){}}function P(e){let t,n;return{c(){t=i("p"),n=u(e[6]),p(t,"class","mt-4")},m(e,r){c(e,t,r),l(t,n)},p(e,t){64&t&&g(n,e[6])},d(e){e&&a(t)}}}function I(e){let t,n,r,o,s,f;return{c(){t=i("p"),n=u("Error : "),r=u(e[0]),o=d(),s=i("p"),f=u(e[6]),p(s,"class","mt-4")},m(e,a){c(e,t,a),l(t,n),l(t,r),c(e,o,a),c(e,s,a),l(s,f)},p(e,t){1&t&&g(r,e[0]),64&t&&g(f,e[6])},d(e){e&&a(t),e&&a(o),e&&a(s)}}}function H(e){let t,n,r,o=e[2]&&D(e);return{c(){o&&o.c(),t=d(),n=i("p"),r=u(e[6]),p(n,"class","mt-4")},m(e,s){o&&o.m(e,s),c(e,t,s),c(e,n,s),l(n,r)},p(e,n){e[2]?o?o.p(e,n):(o=D(e),o.c(),o.m(t.parentNode,t)):o&&(o.d(1),o=null),64&n&&g(r,e[6])},d(e){o&&o.d(e),e&&a(t),e&&a(n)}}}function W(t){let n;return{c(){n=i("p"),n.textContent="Let go to try and read the file!"},m(e,t){c(e,n,t)},p:e,d(e){e&&a(n)}}}function B(t){let n;return{c(){n=i("p"),n.textContent="Loading..."},m(e,t){c(e,n,t)},p:e,d(e){e&&a(n)}}}function D(e){let t;return{c(){t=i("p"),p(t,"class","text-xs sm:text-sm")},m(n,r){c(n,t,r),t.innerHTML=e[2]},p(e,n){4&n&&(t.innerHTML=e[2])},d(e){e&&a(t)}}}function G(t){let n,o,s,u,g,m,h;function x(e,t){return e[1]?B:e[5]?W:e[3]?H:e[0]?I:P}let $=x(t),y=$(t);return{c(){var e,r,l;n=i("div"),o=i("input"),s=d(),u=i("div"),g=i("div"),m=i("div"),y.c(),p(o,"id","hiddenFileInput"),p(o,"type","file"),p(o,"class","hidden"),p(o,"accept",t[4]),p(m,"class","p-4 text-center"),e="word-break",r="break-word",m.style.setProperty(e,r,l?"important":""),p(g,"class","h-full flex flex-col justify-center items-center text-gray-600 font-light text-sm sm:text-base overflow-hidden"),p(u,"class",t[7]),p(n,"class","w-full h-full")},m(e,a,i){c(e,n,a),l(n,o),l(n,s),l(n,u),l(u,g),l(g,m),y.m(m,null),i&&r(h),h=[f(o,"change",t[13]),f(u,"dragenter",t[8]),f(u,"dragover",t[9]),f(u,"dragleave",t[10]),f(u,"drop",t[11]),f(u,"click",t[12])]},p(e,[t]){16&t&&p(o,"accept",e[4]),$===($=x(e))&&y?y.p(e,t):(y.d(1),y=$(e),y&&(y.c(),y.m(m,null))),128&t&&p(u,"class",e[7])},i:e,o:e,d(e){e&&a(n),y.d(),r(h)}}}function O(e,t,n){let{loading:r=!1}=t,{errorMessage:o=null}=t,{successMessage:s=null}=t,{success:l=!1}=t,{onFileSelected:c=null}=t,{allowedType:a="image/tiff"}=t,i=!1,u="",d="ontouchstart"in window||navigator.MaxTouchPoints>0||navigator.msMaxTouchPoints>0;const f=e=>{e.preventDefault(),e.stopPropagation()};let p=null;return e.$set=e=>{"loading"in e&&n(1,r=e.loading),"errorMessage"in e&&n(0,o=e.errorMessage),"successMessage"in e&&n(2,s=e.successMessage),"success"in e&&n(3,l=e.success),"onFileSelected"in e&&n(14,c=e.onFileSelected),"allowedType"in e&&n(4,a=e.allowedType)},e.$$.update=()=>{if(8&e.$$.dirty){const e=`Click here to browse for ${l?"another":"a"} file on your device`,t=`Drag ${l?"another":"a"} file here or click to browse`;n(6,u=d?e:t)}169&e.$$.dirty&&(n(7,p="w-full h-full bg-gray-200 rounded-lg cursor-pointer"),o?n(7,p+=" border-dashed border-4 border-red-500"):i?n(7,p+=" border-dashed border-4 border-green-500"):l&&n(7,p+=" border-4 border-green-400"))},[o,r,s,l,a,i,u,p,e=>{f(e),r||n(5,i=!0)},e=>{f(e),r||n(5,i=!0)},e=>{f(e),r||n(5,i=!1)},e=>{f(e),r||(n(5,i=!1),e.dataTransfer.files[0].type==a?c&&c(e.dataTransfer.files[0]):(n(0,o="File was not a tiff :("),file=null))},e=>{r||document.getElementById("hiddenFileInput").click()},e=>{f(e),e.target.files.length&&c&&c(e.target.files[0])},c]}class q extends N{constructor(e){super(),A(this,e,O,G,s,{loading:1,errorMessage:0,successMessage:2,success:3,onFileSelected:14,allowedType:4})}}function z(e){let t,n,r,o,s,u,f,g;const m=new q({props:{loading:e[0],success:!e[0]&&e[1]&&!e[2],errorMessage:e[2],successMessage:e[3],onFileSelected:e[4]}});return{c(){var e;t=i("main"),n=i("div"),r=i("div"),r.innerHTML='<h1 id="geodeTitle" class="text-green-500 text-4xl tracking-superwide -mr-4 sm:text-5xl sm:tracking-superwider sm:-mr-8 ">Geode</h1> \n\t\t\t<h2 class="text-center text-sm text-gray-600 font-light -mt-1 sm:text-l sm:-mt-2 sm:text-base">An almost really very helpful GeoTIFF previewer</h2>',o=d(),s=i("div"),(e=m.$$.fragment)&&e.c(),u=d(),f=i("p"),f.textContent="No information on your files is uploaded, and all processing happens on your own machine.",p(r,"class","flex flex-col justify-center items-center pt-4 mx-6"),p(s,"class","w-full flex-1 px-6 py-4 overflow-hidden"),p(f,"class","w-full text-center px-8 pb-4 text-xs text-gray-500"),p(n,"class","container mx-auto flex flex-col h-full"),p(t,"class","w-full h-full")},m(e,a){c(e,t,a),l(t,n),l(n,r),l(n,o),l(n,s),S(m,s,null),l(n,u),l(n,f),g=!0},p(e,[t]){const n={};1&t&&(n.loading=e[0]),7&t&&(n.success=!e[0]&&e[1]&&!e[2]),4&t&&(n.errorMessage=e[2]),8&t&&(n.successMessage=e[3]),m.$set(n)},i(e){g||(L(m.$$.fragment,e),g=!0)},o(e){!function(e,t,n,r){if(e&&e.o){if(E.has(e))return;E.add(e),(void 0).c.push(()=>{E.delete(e),r&&(n&&e.d(1),r())}),e.o(t)}}(m.$$.fragment,e),g=!1},d(e){e&&a(t),C(m)}}}function J(e,t,n){let r=!1,o=null,s=null,l=null;const c=new Worker("./worker/geodeWW.js");c.onmessage=function(e){const t=e.data;!t||t.error?n(2,s=t.error):(n(1,o=t.data),n(3,l=t.successMessage)),n(0,r=!1)};return[r,o,s,l,e=>{c.postMessage(e),n(1,o=null),n(2,s=null),n(3,l=null),n(0,r=!0)}]}return new class extends N{constructor(e){super(),A(this,e,J,z,s,{})}}({target:document.body})}();
//# sourceMappingURL=bundle.js.map
