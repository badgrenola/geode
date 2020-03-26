
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var reader = new FileReader();

    // file reading started
    reader.addEventListener('loadstart', function() {
        console.log('File reading started');
    });

    // file reading finished successfully
    reader.addEventListener('load', function(e) {
        var text = e.target.result;

        // contents of the file
        console.log("Finished loading the whole file very inefficiently");
    });

    // file reading failed
    reader.addEventListener('error', function() {
        alert('Error : Failed to read file');
    });

    // file read progress 
    reader.addEventListener('progress', function(e) {
        if(e.lengthComputable == true) {
        	var percent_read = Math.floor((e.loaded/e.total)*100);
        	console.log(percent_read + '% read');
        }
    });

    /* src/components/DropZone.svelte generated by Svelte v3.20.1 */
    const file_1 = "src/components/DropZone.svelte";

    // (108:20) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Drag a file here or click to browse";
    			add_location(p, file_1, 108, 24, 3203);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(108:20) {:else}",
    		ctx
    	});

    	return block;
    }

    // (106:20) {#if isMobile}
    function create_if_block_3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Click here to browse for a file on your device";
    			add_location(p, file_1, 106, 24, 3094);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(106:20) {#if isMobile}",
    		ctx
    	});

    	return block;
    }

    // (103:39) 
    function create_if_block_2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*errorMessage*/ ctx[2]);
    			add_location(p, file_1, 103, 20, 2989);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMessage*/ 4) set_data_dev(t, /*errorMessage*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(103:39) ",
    		ctx
    	});

    	return block;
    }

    // (100:31) 
    function create_if_block_1(ctx) {
    	let p0;
    	let t0;
    	let i;
    	let t1_value = /*file*/ ctx[1].name + "";
    	let t1;
    	let t2;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Current file is : ");
    			i = element("i");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "Drag another file here or click to browse";
    			add_location(i, file_1, 100, 61, 2812);
    			attr_dev(p0, "class", "text-center");
    			add_location(p0, file_1, 100, 20, 2771);
    			attr_dev(p1, "class", "text-center mt-4");
    			add_location(p1, file_1, 101, 20, 2855);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			append_dev(p0, i);
    			append_dev(i, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*file*/ 2 && t1_value !== (t1_value = /*file*/ ctx[1].name + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(100:31) ",
    		ctx
    	});

    	return block;
    }

    // (98:16) {#if isDropping}
    function create_if_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Let go to try and read the file!";
    			add_location(p, file_1, 98, 20, 2679);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(98:16) {#if isDropping}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div3;
    	let input;
    	let t;
    	let div2;
    	let div1;
    	let div0;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*isDropping*/ ctx[0]) return create_if_block;
    		if (/*file*/ ctx[1]) return create_if_block_1;
    		if (/*errorMessage*/ ctx[2]) return create_if_block_2;
    		if (/*isMobile*/ ctx[4]) return create_if_block_3;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			input = element("input");
    			t = space();
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if_block.c();
    			attr_dev(input, "id", "hiddenFileInput");
    			attr_dev(input, "type", "file");
    			attr_dev(input, "class", "hidden");
    			attr_dev(input, "accept", "image/tiff");
    			add_location(input, file_1, 80, 4, 2126);
    			attr_dev(div0, "class", "p-4");
    			add_location(div0, file_1, 96, 12, 2608);
    			attr_dev(div1, "class", "h-full flex flex-col justify-center items-center text-gray-600 font-light text-sm sm:text-base");
    			add_location(div1, file_1, 95, 8, 2487);
    			attr_dev(div2, "class", /*dropzoneClasses*/ ctx[3]);
    			add_location(div2, file_1, 87, 4, 2281);
    			attr_dev(div3, "class", "w-full h-full");
    			add_location(div3, file_1, 79, 0, 2094);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, input);
    			append_dev(div3, t);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			if_block.m(div0, null);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "change", /*selectedFile*/ ctx[5], false, false, false),
    				listen_dev(div2, "dragenter", /*onDragEnter*/ ctx[6], false, false, false),
    				listen_dev(div2, "dragover", /*onDragOver*/ ctx[7], false, false, false),
    				listen_dev(div2, "dragleave", /*onDragLeave*/ ctx[8], false, false, false),
    				listen_dev(div2, "drop", /*onDrop*/ ctx[9], false, false, false),
    				listen_dev(div2, "click", /*onClick*/ ctx[10], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if (dirty & /*dropzoneClasses*/ 8) {
    				attr_dev(div2, "class", /*dropzoneClasses*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let isDropping = false;
    	let file = null;
    	let errorMessage = null;

    	//Check for touch events
    	let isMobile = "ontouchstart" in window || navigator.MaxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

    	//Define the input file browse events
    	const selectedFile = e => {
    		e.preventDefault();
    		$$invalidate(2, errorMessage = null);

    		//If a file was chosen, store it
    		if (e.target.files.length) {
    			$$invalidate(1, file = e.target.files[0]);
    		}
    	};

    	//Define the drag/drop events
    	const preventDefaults = e => {
    		e.preventDefault();
    		e.stopPropagation();
    	};

    	const onDragEnter = e => {
    		preventDefaults(e);
    		$$invalidate(0, isDropping = true);
    		$$invalidate(2, errorMessage = null);
    	};

    	const onDragOver = e => {
    		preventDefaults(e);
    		$$invalidate(0, isDropping = true);
    	};

    	const onDragLeave = e => {
    		preventDefaults(e);
    		$$invalidate(0, isDropping = false);
    	};

    	const onDrop = e => {
    		preventDefaults(e);
    		$$invalidate(0, isDropping = false);

    		//Ensure file is a tiff
    		if (e.dataTransfer.files[0].type == "image/tiff") {
    			$$invalidate(1, file = e.dataTransfer.files[0]);
    			getFileInfo(file);
    		} else {
    			$$invalidate(2, errorMessage = "File was not a tiff :(");
    			$$invalidate(1, file = null);
    		}
    	};

    	const onClick = e => {
    		//Get the hidden input and click
    		document.getElementById("hiddenFileInput").click();
    	};

    	//Handle the actually file reading
    	const getFileInfo = file => {
    		reader.readAsText(file);
    	};

    	//Update the dropzone style depending on whether we're in process of dropping/already have a file
    	let dropzoneClasses = null;

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DropZone> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DropZone", $$slots, []);

    	$$self.$capture_state = () => ({
    		reader,
    		isDropping,
    		file,
    		errorMessage,
    		isMobile,
    		selectedFile,
    		preventDefaults,
    		onDragEnter,
    		onDragOver,
    		onDragLeave,
    		onDrop,
    		onClick,
    		getFileInfo,
    		dropzoneClasses
    	});

    	$$self.$inject_state = $$props => {
    		if ("isDropping" in $$props) $$invalidate(0, isDropping = $$props.isDropping);
    		if ("file" in $$props) $$invalidate(1, file = $$props.file);
    		if ("errorMessage" in $$props) $$invalidate(2, errorMessage = $$props.errorMessage);
    		if ("isMobile" in $$props) $$invalidate(4, isMobile = $$props.isMobile);
    		if ("dropzoneClasses" in $$props) $$invalidate(3, dropzoneClasses = $$props.dropzoneClasses);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*errorMessage, dropzoneClasses, isDropping, file*/ 15) {
    			 {
    				$$invalidate(3, dropzoneClasses = "w-full h-full bg-gray-200 rounded-lg cursor-pointer");

    				if (errorMessage) {
    					$$invalidate(3, dropzoneClasses += " border-dashed border-4 border-red-500");
    				} else if (isDropping) {
    					$$invalidate(3, dropzoneClasses += " border-dashed border-4 border-green-500");
    				} else if (file) {
    					$$invalidate(3, dropzoneClasses += " border-4 border-green-400");
    				}
    			}
    		}
    	};

    	return [
    		isDropping,
    		file,
    		errorMessage,
    		dropzoneClasses,
    		isMobile,
    		selectedFile,
    		onDragEnter,
    		onDragOver,
    		onDragLeave,
    		onDrop,
    		onClick
    	];
    }

    class DropZone extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DropZone",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.20.1 */
    const file = "src/App.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let div1;
    	let t4;
    	let p;
    	let current;
    	const dropzone = new DropZone({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Geode";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "A really very helpful GeoTIFF previewer";
    			t3 = space();
    			div1 = element("div");
    			create_component(dropzone.$$.fragment);
    			t4 = space();
    			p = element("p");
    			p.textContent = "No information on your files is uploaded, and all processing happens on your own machine.";
    			attr_dev(h1, "id", "geodeTitle");
    			attr_dev(h1, "class", "text-green-500 text-4xl tracking-superwide -mr-4 sm:text-5xl sm:tracking-superwider sm:-mr-8 ");
    			add_location(h1, file, 12, 3, 243);
    			attr_dev(h2, "class", "text-gray-600 font-light -mt-1 sm:text-l sm:-mt-2");
    			add_location(h2, file, 13, 3, 379);
    			attr_dev(div0, "class", "flex flex-col justify-center items-center pt-8");
    			add_location(div0, file, 11, 2, 179);
    			attr_dev(div1, "class", "w-full flex-1 p-8");
    			add_location(div1, file, 15, 2, 497);
    			attr_dev(p, "class", "w-full text-center px-8 pb-8 text-sm text-gray-500");
    			add_location(p, file, 18, 2, 556);
    			attr_dev(div2, "class", "container mx-auto flex flex-col h-full");
    			add_location(div2, file, 10, 1, 124);
    			attr_dev(main, "class", "w-full h-full");
    			add_location(main, file, 9, 0, 94);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, h2);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			mount_component(dropzone, div1, null);
    			append_dev(div2, t4);
    			append_dev(div2, p);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(dropzone.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(dropzone.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(dropzone);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ DropZone });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
