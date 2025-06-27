!(function (ctx) {
  let htmlEditor, cssEditor, jsEditor;
  const outputIframe = document.getElementById("output-iframe");
  const ifrw = outputIframe.contentWindow
    ? outputIframe.contentWindow
    : outputIframe.contentDocument.document
    ? outputIframe.contentDocument.document
    : outputIframe.contentDocument;
  class Storage {
    constructor(options) {
      this.storeHandler = localStorage;
      this.getKeyHandler = (key) => `__${key}__`;
    }
    get(targetKey) {
      const key = this.getKeyHandler(targetKey);
      const orignalStore = this.storeHandler.getItem(key);
      const { value } = JSON.parse(orignalStore || "{}");
      return value;
    }
    set(targetKey, value) {
      const key = this.getKeyHandler(targetKey);
      this.storeHandler.setItem(key, JSON.stringify({ key, value }));
    }
    move(targetKey) {
      const key = this.getKeyHandler(targetKey);
      this.storeHandler.removeItem(key);
    }
  }
  const storage = new Storage();
  function generateSrcDoc() {
    const contentMap = {
      htmlContent: .getValue(),
      cssContent: cssEditor.getValue(),
      jsContent: jsEditor.getValue(),
    };
    storage.set("cssContent", contentMap.cssContent);
    storage.set("htmlContent", contentMap.htmlContent);
    storage.set("jsContent", contentMap.jsContent);
    var html = contentMap.htmlContent,
      css = contentMap.cssContent,
      js = contentMap.jsContent,
      src = html;
    if (html) {
      var patternHtmlTag = /<html([^>]*)>/im;
      var array_matches_html_tag = patternHtmlTag.exec(src);
      if (array_matches_html_tag) {
        src = src.replace("<html>", "<html " + array_matches_html_tag[1] + ">");
      }
      var patternHead = /<head[^>]*>((.|[\n\r])*)<\/head>/im;
      var array_matches_head = patternHead.exec(src);

      var patternBodyTag = /<body([^>]*)>/im;
      var array_matches_body_tag = patternBodyTag.exec(src);
      if (array_matches_body_tag) {
        src = src.replace("<body>", "<body " + array_matches_body_tag[1] + ">");
      }
    }
    // CSS
    if (css) {
      css = "\n<style>\n" + css + "\n</style>\n";
      if (array_matches_head) {
        src = src.replace("</head>", css + "</head>");
      } else if (array_matches_body_tag) {
        src = src.replace("</body>", css + "</body>");
      } else {
        src += css;
      }
    }

    // Javascript
    if (js) {
      js = "\n<script>\n" + js + "\n</script>\n";
      if (array_matches_body_tag) {
        src = src.replace("</body>", js + "</body>");
      } else {
        src += js;
      }
    }
    var text = src;
    return text;
  }
  ((...fns) => {
    for (let index = 0; index < fns.length; index++) {
      const fn = fns[index];
      if ("function" == typeof fn) fn();
    }
  })(
    // Split
    function () {
      Split(["#tab-container", "#output-container"], {
        sizes: [60, 40],
        minSize: 0,
        gutterSize: 10,
        snapOffset: 0,
      });
      Split(["#iframe-container", "#console-container"], {
        direction: "vertical",
        sizes: [80, 20],
        minSize: 0,
        gutterSize: 10,
        snapOffset: 0,
      });
    },
    // Console
    function () {
      try {
        const output = document.querySelector("#console code");
        function print(logStr) {
          const oldStr = output.textContent;
          const newStr = "> " + logStr + "\n";
          output.textContent = oldStr + newStr;
        }
        function parseData(data) {
          if (null == data || "boolean" == typeof data) {
            return String(data);
          } else if ("number" == typeof data) {
            return Object.is(data, -0) ? "-0" : String(data);
          } else if ("bigint" == typeof data) {
            return String(data) + "n";
          } else if ("string" == typeof data) {
            return data.includes('"') ? "'" + data + "'" : '"' + data + '"';
          } else if (Array.isArray(data)) {
            return "[" + parseArrayData(data) + "]";
            // return "Array [" + parseArrayData(data) + "]"
          } else {
            return (function (data) {
              const type = data.constructor ? data.constructor.name : data;
              if ("String" === type) return `String { "${data.valueOf()}" }`;
              if (data === JSON) return "JSON {}";
              if (
                type.match &&
                type.match(/^(ArrayBuffer|SharedArrayBuffer|DataView)$/)
              )
                return type + " {}";
              if (
                type.match &&
                type.match(
                  /^(Int8Array|Int16Array|Int32Array|Uint8Array|Uint16Array|Uint32Array|Uint8ClampedArray|Float32Array|Float64Array|BigInt64Array|BigUint64Array)$/
                )
              )
                return data.length > 0
                  ? type + " [" + r(data) + "]"
                  : type + " []";
              if ("Symbol" === type && void 0 !== data) return data.toString();
              if ("Object" === type) {
                let str = "",
                  flag = !0;
                for (const key in data)
                  Object.prototype.hasOwnProperty.call(data, key) &&
                    (flag ? (flag = !1) : (str += ", "),
                    (str = str + key + ": " + parseData(data[key])));
                return "{ " + str + " }";
                // return type + " { " + str + " }";
              }
              if (!data.constructor && !data.prototype) {
                let str = "",
                  flag = !0;
                for (const key in data)
                  flag ? (flag = !1) : (str += ", "),
                    (str = str + key + ": " + parseData(data[key]));
                return "{ " + str + " }";
                // return "Object { " + str + " }";
              }
              return data;
            })(data);
          }
        }
        const onLogOrError = () => {
          const console = ifrw.console,
            log = console.log,
            error = console.error;
          // const parentConsole = ifrw.parent.console;
          // parentConsole.error = (err, ...args) => {
          //   console.info("报错了");
          // };
          // ifrw.onerror = (err, ...args) => {
          //   console.info("报错了");
          // };
          // console.error = (err, ...args) => {
          //   console.info("报错了");
          //   error.apply(console, args);
          //   print(err);
          // };
          console.log = (...args) => {
            const strs = args?.map((arg) => parseData(arg));
            log.apply(console, args);
            print(strs.join(" "));
          };
        };
        onLogOrError();
      } catch (error) {
        console.error(error);
      }
    },
    // Tabs
    function () {
      const tabContainer = document.getElementById("tab-container");
      const editorContainer = document.getElementById("editor-container");
      const tabButton = tabContainer.querySelectorAll('button[role="tab"]');
      const tablist = document.getElementById("tablist");
      function g(e, t) {
        t &&
          (t.setAttribute("aria-selected", !1), t.setAttribute("tabindex", -1)),
          e.setAttribute("aria-selected", !0),
          e.removeAttribute("tabindex"),
          e.focus();
      }
      function p(key) {
        const t = tablist.querySelector('button[aria-selected="true"]');
        ("forward" !== key && "reverse" !== key) ||
          ("forward" === key
            ? t.nextElementSibling
              ? (g(t.nextElementSibling, t), t.nextElementSibling.click())
              : (g(tabButton[0]), tabButton[0].click())
            : "reverse" === key &&
              (t.previousElementSibling
                ? (g(t.previousElementSibling, t),
                  t.previousElementSibling.click())
                : (g(tabButton[tabButton.length - 1]),
                  tabButton[tabButton.length - 1].click())));
      }
      function tablistAddEventListener() {
        tablist.addEventListener("click", (e) => {
          const target = e.target;
          if ("tab" === target.getAttribute("role")) {
            const selectedTab = tablist.querySelector(
              'button[aria-selected="true"]'
            );
            const selectedTabPanel = document.getElementById(
              target.getAttribute("aria-controls")
            );
            const allTabPanel =
              tabContainer.querySelectorAll('[role="tabpanel"]');
            for (const e of allTabPanel) e.classList.add("hidden");
            g(target, selectedTab);
            selectedTabPanel.classList.remove("hidden");
            selectedTabPanel.setAttribute("aria-hidden", false);
          }
        });
        tablist.addEventListener("keyup", (e) => {
          switch ((e.stopPropagation(), e.key)) {
            case "ArrowRight":
            case "ArrowDown":
              p("forward");
              break;
            case "ArrowLeft":
            case "ArrowUp":
              p("reverse");
              break;
            case "Home":
              g(tabButton[0]);
              break;
            case "End":
              g(tabButton[tabButton.length - 1]);
              break;
            case "default":
              return;
          }
        });
      }
      tablistAddEventListener();
      editorContainer.classList.remove("hidden");
      const showTabs = (function (e) {
        return e.dataset && e.dataset.tabs
          ? e.dataset.tabs.split(",")
          : ["html", "css", "js"];
      })(editorContainer);
      const defaultTab = (function (e, t) {
        return e.dataset && e.dataset.defaultTab
          ? e.dataset.defaultTab
          : t.includes("js")
          ? "js"
          : "html";
      })(editorContainer, showTabs);
      (function (tabs, defaultTabEl) {
        if (defaultTabEl) {
          const defaultTabPanelEl = document.getElementById(
            defaultTabEl.id + "-panel"
          );
          defaultTabEl.setAttribute("aria-selected", !0);
          defaultTabEl.removeAttribute("tabindex");
          defaultTabPanelEl.classList.remove("hidden");
          defaultTabPanelEl.setAttribute("aria-hidden", false);
          defaultTabEl.focus();
        }
        for (const tab of tabs) {
          document.getElementById(tab).classList.remove("hidden");
        }
      })(showTabs, document.getElementById(defaultTab));
    },
    // Editor
    function () {
      const cssEditorEl = document.getElementById("css-editor");
      const htmlEditorEl = document.getElementById("html-editor");
      const jsEditorEl = document.getElementById("js-editor");
      const run = document.getElementById("run");
      const isautorun = document.getElementById("isautorun");

      function createEditor() {
        const theme = ctx.matchMedia("(prefers-color-scheme: dark)").matches
          ? "vs-dark"
          : "vs";
        [htmlEditor, cssEditor, jsEditor] = [
          { language: "html", el: htmlEditorEl, content: "htmlContent" },
          { language: "css", el: cssEditorEl, content: "cssContent" },
          { language: "javascript", el: jsEditorEl, content: "jsContent" },
        ].map(({ language, el, content }) => {
          return monaco.editor.create(el, {
            value: storage.get(content),
            language: language,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            contextmenu: false,
            minimap: { enabled: false },
            theme: theme,
          });
        });
        jsEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          formatDocument();
        });
	      // ✅ 常见 HTML 标签列表
	      const htmlTags = [
	        "div", "span", "section", "article", "header", "footer", "main",
	        "aside", "nav", "ul", "ol", "li", "a", "p", "h1", "h2", "h3",
	        "h4", "h5", "h6", "button", "input", "textarea", "label", "form",
	        "table", "thead", "tbody", "tr", "td", "th", "img", "video", "svg"
	      ];

	      // ✅ 注册所有标签的 Snippet
	      monaco.languages.registerCompletionItemProvider('html', {
	        provideCompletionItems: () => {
	          const suggestions = htmlTags.map(tag => ({
	            label: tag,
	            kind: monaco.languages.CompletionItemKind.Snippet,
	            insertText: `<${tag}>$0</${tag}>`,
	            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
	            documentation: `Insert <${tag}></${tag}>`
	          }));
	          return { suggestions };
	        }
	      });
      }
      function writeIframe() {
        const text = generateSrcDoc();

        ifrw.document.open();
        ifrw.document.write(text);
        ifrw.document.close();
      }
      isautorun.setAttribute("checked", true);
      isautorun.addEventListener("change", (e) => {
        isautorun.setAttribute("checked", e.target.checked);
      });
      function formatDocument() {
        htmlEditor.trigger("a", "editor.action.formatDocument");
        cssEditor.trigger("a", "editor.action.formatDocument");
        jsEditor.trigger("a", "editor.action.formatDocument");
        if (isautorun.checked) {
          writeIframe();
        }
      }
      document.addEventListener("keydown", (e) => {
        if (e.key === "s" && e.ctrlKey) {
          e.preventDefault();
          formatDocument();
        }
      });
      run.addEventListener("click", writeIframe);
      // outputIframe.addEventListener("keydown", (e) => {
      //   if (e.key === "s" && e.ctrlKey) {
      //     console.log("prevent");
      //     e.preventDefault();
      //   }
      // });
      createEditor();
      writeIframe();
    },
    // Actions
    function () {
      const header = document.querySelector(".header");
      const tabActions = document.querySelector(".tab-actions");
      const buttonsContainer = document.querySelector(".buttons-container");
      const libsModal = document.getElementById("libs_modal");
      header.addEventListener("click", (e) => {
        if (e.target.classList.contains("reset")) {
          storage.move("cssContent");
          storage.move("jsContent");
          storage.move("htmlContent");
          ctx.location.reload();
        }
      });
      tabActions.addEventListener("click", (e) => {
        if (e.target.classList.contains("basehtml")) {
          htmlEditor.setValue(
            `<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="UTF-8" />
	<title>Tailwind CDN 示例</title>
	<script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-gray-100 p-6">
	<h1 class="text-2xl font-bold mb-4 text-blue-600">我的第一个HTML页面</h1>
	<div class="grid grid-cols-3 min-w-[300px] w-max gap-4 overflow-x-auto">
		<div class="bg-blue-500 text-white text-center p-4 rounded">1</div>
		<div class="bg-blue-500 text-white text-center p-4 rounded">2</div>
		<div class="bg-blue-500 text-white text-center p-4 rounded">3</div>
		<div class="bg-blue-500 text-white text-center p-4 rounded">4</div>
	</div>
</body>

</html>`
          );
          // htmlEditor.setValue(
          //   '<!DOCTYPE html>\r\n<html>\r\n<head>\r\n<meta charset="utf-8">\r\n<title>文档标题</title>\r\n</head>\r\n<body>\r\n\t<h1>我的第一个HTML页面</h1>\r\n\t<p>我的第一个段落。</p>\r\n</body>\r\n</html>\r\n'
          // );
        }
        if (e.target.classList.contains("download")) {
          const text = generateSrcDoc();
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([text], { type: "text/html" }));
          a.download = "demo.html";
          a.click();
        }
        if (e.target.classList.contains("libs")) {
          libsModal.style.display = "block";
        }
      });
      buttonsContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("clear")) {
          document.querySelector("#console code").textContent = "";
        }
      });
    },
    // Libs
    function () {
      const libsModal = document.getElementById("libs_modal");
      const libsClose = document.getElementById("libs_close");
      const searchInput = document.getElementById("searchInput");
      const searchButton = document.getElementById("searchButton");
      const spinner = document.getElementById("spinner");
      const libsTable = document.getElementById("libs-table");
      ctx.insertLib = function insertLib(event) {
        const { name, libsrc } = event.target.dataset;
        _editor_content = htmlEditor.getValue();
        _libsrc = libsrc;
        if (_editor_content.indexOf(_libsrc) !== -1) {
          return;
        }
        if (_libsrc.indexOf(".js") !== -1) {
          _libsrc = '<script src="' + _libsrc + '"></script>\n';
        } else if (_libsrc.indexOf(".css") !== -1) {
          _libsrc = '<link rel="stylesheet" href="' + _libsrc + '">\n';
        }

        patternBody = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
        array_matches_body = patternBody.exec(_editor_content);
        patternHead = /<head[^>]*>((.|[\n\r])*)<\/head>/im;
        array_matches_head = patternHead.exec(_editor_content);

        if (array_matches_head) {
          _editor_content = _editor_content.replace(
            "</head>",
            _libsrc + "</head>"
          );
        } else if (array_matches_body) {
          _editor_content = _editor_content.replace(
            "</body>",
            _libsrc + "</body>"
          );
        } else {
          _editor_content = _libsrc + _editor_content;
        }
        htmlEditor.setValue(_editor_content);
      };
      function handleSearch(value) {
        if (spinner.innerText == "Searching...") return;
        if (!value) {
          libsTable.innerHTML = "";
          libsTable.style.display = "none";
          return;
        }
        spinner.innerText = "Searching...";
        // 发起请求
        fetch(`https://api.cdnjs.com/libraries?search=${value}&fields=homepage`)
          .then((res) => res.json())
          .then((data) => {
            // 构建表格内容
            const rows = data.results
              .slice(0, 10)
              .map(
                (item, index) => `
                <tr>
                    <th>${index + 1}</th>
                    <td>${item.name}</td>
                    <td>${item.latest}</td>
                    <td><button class="btn btn-ghost btn-xs" data-name="${
                      item.name
                    }" data-libsrc="${
                  item.latest
                }" onclick="insertLib(event)">插入</button></td>
                </tr>
            `
              )
              .join("");
            // 更新表格
            libsTable.style.display = "block";
            if (rows) {
              libsTable.innerHTML = `<table class="table"><thead><tr><th></th><th>库名</th><th>地址</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table>`;
            } else {
              libsTable.innerHTML =
                '<table class="table"><thead><tr><th></th><th>库名</th><th>地址</th><th>操作</th></tr></thead><tbody><tr><td colspan="4" style="text-align: center;">Empty</td></tr></tbody></table>';
            }
          })
          .catch((err) => {
            console.error(err);
            // 请求失败处理
            alert("请求失败，请稍后重试。");
          })
          .finally(() => {
            spinner.innerText = "Press enter to search";
          });
      }
      libsClose.addEventListener("click", () => {
        libsModal.style.display = "none";
      });
      ctx.onclick = function (event) {
        if (event.target == libsModal) {
          libsModal.style.display = "none";
        }
      };
      searchInput.addEventListener("search", (e) => {
        handleSearch(e.target.value);
      });
      searchButton.addEventListener("click", () => {
        handleSearch(searchInput.value);
      });
    }
  );
})(this);
