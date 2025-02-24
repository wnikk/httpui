'use strict';
(function(global, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like environments that support module.exports, like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        global.httpUi = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {

    /**
     * Class representing a query UI.
     */
    class queryUi
    {
        /**
         * Create a query UI.
         *
         * @param {Object|string} params - The parameters for the query.
         */
        constructor(params)
        {
            if (typeof params === 'string' || params instanceof String) {
                params = {
                    url: params,
                };
            }
            if (!params) {params = {};}
            var query = {
                id: null,
                url: null,
                method: 'GET',
                headers: {
                    'Accept': 'application/json, text/javascript',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                },
                data: undefined,
                onSuccess: null,
                onError: null,
                context: document.body,
                contextLock: undefined,
                contextStatus: undefined,
                ui: null,
                ...params
            };
            Object.assign(this, query);
        }

        /**
         * Add response data to the query.
         *
         * @param {Object} responseObject - The response object.
         * @param {Object} responseData - The response data.
         * @returns {queryUi} The updated query UI.
         */
        addResponse(responseObject, responseData)
        {
            this.requestData = this.data;
            this.response = responseObject;
            this.data = responseData;
            return this;
        }
    }

    /**
     * Class representing the UI.
     */
    class ui
    {
        /**
         * Create a UI.
         *
         * @param {Object} params - The parameters for the UI.
         */
        constructor(params)
        {
            this.id = params?.id??('0'+(new Date().getTime()) + '' + (Math.random() * 1000));
            this.context = params?.context??document.body;
            this.contextLock   = params?.contextLock??this.context;
            this.contextStatus = params?.contextStatus??this.context;

            this.errorsMap = {
                'error': '&#9888; ',
                '0': 'An error occurred: Could not connect to the server, please check your internet connection.',
                '400': 'An error occurred: 400 - request failed',
                '404': 'An error occurred: 404 - page not found or address changed',
                '500': 'The server encountered a 500 - unknown error',
                'parsererror': 'An error occurred: parser - the server returned an invalid JSON request',
                'timeout': 'An error occurred: timeout - the request timed out too long',
                'unknown': 'An error occurred: ',
            };
        }

        /**
         * Display a loading spinner.
         *
         * @param {HTMLElement} context - The context element.
         * @param {string} ajaxId - The AJAX ID.
         * @returns {string} The AJAX ID.
         */
        displayLoader(context, ajaxId)
        {
            context = context || this.contextLock;
            ajaxId  = ajaxId  || this.id;

            const loader = document.createElement('div');
            loader.id = `aj-loader-${ajaxId}`;
            loader.className = `aj-loader-${ajaxId} aj-loader-parent`;
            loader.innerHTML = `
                <div class="aj-loader-element">
                    <svg class="aj-circular" viewBox="25 25 50 50">
                        <circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/>
                        <circle class="path" cx="50" cy="50" r="15" fill="none" stroke-width="2" stroke-miterlimit="10"/>
                        <circle class="path" cx="50" cy="50" r="10" fill="none" stroke-width="2" stroke-miterlimit="10"/>
                    </svg>
                </div>`;
            loader.style.width = `${context.offsetWidth + 20}px`;
            loader.style.height = `${context.offsetHeight + 20}px`;
            context.prepend(loader);
            return ajaxId;
        }

        /**
         * Hide the loading spinner.
         *
         * @param {string} ajaxId - The AJAX ID.
         */
        hideLoader(ajaxId)
        {
            ajaxId  = ajaxId  || this.id;
            const loader = document.querySelector(`.aj-loader-${ajaxId}`);
            if (loader) {
                loader.style.opacity = 0;
                setTimeout(() => loader.remove(), 300);
            }
        }

        /**
         * Get error text based on status.
         *
         * @param {Object} response - The response object.
         * @returns {string} The error text.
         */
        #getErrorText(response)
        {
            return this.errorsMap[response?.status]
                ?? this.errorsMap[response?.statusText]
                //?? this.errorsMap[errorThrown]
                ?? `${this.errorsMap.unknown}${response?.status} ${response?.statusText}`;
        }

        /**
         * Escape HTML to prevent injection attacks.
         *
         * @param {string} unsafe - The unsafe HTML string.
         * @returns {string} The escaped HTML string.
         */
        escapeHtml(unsafe)
        {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        /**
         * Display an alert box.
         *
         * @param {string} html - The HTML content of the alert.
         * @param {string} type - The type of the alert.
         * @returns {HTMLElement} The alert element.
         */
        showAlert(html, type)
        {
            const context = this.contextStatus;
            const ajaxId = this.id;

            if (typeof type === 'undefined') {type = 'info';}
            const alert = document.createElement('div');
            alert.id = `aj-status-${ajaxId}`;
            alert.className = `aj-status-${ajaxId} aj-notification`;

            alert.innerHTML = `
                <div id="alert-${ajaxId}" class="alert alert-dismissible alert-${type}" role="alert">
                    <button type="button" class="btn-close" style="float: right;"></button>
                    <div>${html}</div>
                </div>`;
            context.prepend(alert);
            alert.querySelector('.btn-close').addEventListener(
                'click',
                () => this.hideAlert(alert)
            );
            return alert;
        }

        /**
         * Display a success message.
         *
         * @param {string} html - The HTML content of the success message.
         */
        showSuccess(html)
        {
            this.showAlert(
                html,
                'success'
            );
        }

        /**
         * Display an extended alert box.
         *
         * @param {Object} json - The JSON object containing the alert message and errors.
         */
        showAlertExtended(json)
        {
            this.showAlert(
                '<strong>'+json?.message+'</strong>'+
                (json.errors?this.errorsToUlTree(json.errors):''),
                'danger'
            );
        }

        /**
         * Display an alert box for a page expired error.
         *
         * @returns {HTMLElement} The alert element.
         */
        showAlertPageExpired()
        {
            const data = {
                message: "Page Expired",
                errors: ["Please reload the page."],
            };
            return this.showAlertExtended(data);
        }

        /**
         * Display an alert box for an unexpected error.
         *
         * @param {Object} jqXHR - The jQuery XMLHttpRequest object.
         * @returns {HTMLElement} The alert element.
         */
        showAlertUnexpected(jqXHR)
        {
            const errorText = this.#getErrorText(jqXHR);

            const html = `
                <button type="button" class="btn-detailed">Detailed...</button>
                <strong>${this.errorsMap.error}</strong>${this.escapeHtml(errorText)}
            `;
            const alert = this.showAlert(
                html,
                'danger',
            );
            const report = document.createElement('div');
            report.className = 'aj-error-report';
            report.style.zIndex = '999999';
            report.style.display = 'none';
            report.innerHTML = `
                <button type="button" class="btn-detailed">html</button>
                <strong>Status code</strong>: ${this.escapeHtml(jqXHR.status.toString())}<br/>
                <strong>Status text</strong>: ${this.escapeHtml(jqXHR.statusText)}<br/>
                <strong>Response body</strong>:
                <div class="aj-error-response">
                    <textarea>${this.escapeHtml(jqXHR.responseText)}</textarea>
                </div>
            `;
            alert.append(report);

            alert.querySelector('.alert .btn-detailed').addEventListener('click', () => {
                alert.querySelector('.aj-error-report').style.display = 'block';
            });
            report.querySelector('.btn-detailed').addEventListener('click', () => {
                const html = report.querySelector('textarea').value;
                const iframe = document.createElement('iframe');
                iframe.className = 'aj-error-response-iframe';
                report.querySelector('.aj-error-response').innerHTML = '';
                report.querySelector('.aj-error-response').appendChild(iframe);
                setTimeout(() => iframe.contentDocument.body.innerHTML = html, 100);
                report.querySelector('.aj-error-report .btn-detailed').style.display = 'none';
            });
            return alert;
        }

        /**
         * Remove all alert boxes.
         */
        remAlerts()
        {
            const context = this.contextStatus;
            context.querySelectorAll('.aj-notification').forEach(e => e.remove());
        }

        /**
         * Hide an alert box.
         *
         * @param {HTMLElement} alert - The alert element.
         */
        hideAlert(alert)
        {
            alert.style.transition = "all 300ms ease-in";
            alert.style.overflow = "hidden";
            alert.style.height = `${alert.getBoundingClientRect().height}px`;

            setTimeout( () => { alert.style.height = '0px'; }, 100);
            setTimeout( () => { alert.remove(); }, 400);
        }

        /**
         * Convert an array of errors to a nested list.
         *
         * @param {Object} errors - The errors object.
         * @returns {string} The HTML string of the nested list.
         */
        errorsToUlTree(errors)
        {
            if (!Object.keys(errors).length) {return '';}
            return '<ul><li>'+this.flatDeep(errors).join('</li><li>')+'</li></ul>';
        }

        /**
         * Flatten a nested array.
         *
         * @param {Array} array - The nested array.
         * @returns {Array} The flattened array.
         */
        flatDeep(array)
        {
            let flattend = [];
            (function flat(array) {
                for (const [key, val] of Object.entries(array)) {
                    if (typeof val === 'object') {flat(val);}
                    else {flattend.push(val);}
                }
            })(array);
            return flattend;
        }
    }

    /**
     * Class representing the HttpUi.
     */
    class HttpUi extends Function
    {
        /**
         * Create an HttpUi instance.
         */
        constructor()
        {
            super();
            return new Proxy(this, {
                //apply: (target, thisArg, args) => target.request(...args)
                apply: (target, thisArg, args) => {
                    let params = args[0];
                    if (typeof params === 'string' || params instanceof String) {
                        params = {
                            url: params,
                        };
                    }
                    if (thisArg && thisArg[0] instanceof HTMLElement) {
                        params = { ...params, context: thisArg[0] };
                    }
                    return target.request(params)
                }
            })
        }

        /**
         * Check if a variable is an object.
         *
         * @param {*} x - The variable to check.
         * @returns {boolean} True if the variable is an object, false otherwise.
         */
        isObject(x)
        {
            return typeof x !== 'function' && Object (x) === x;
        }

        /**
         * Merge defaults with user options.
         *
         * @param {Object} defaults - The default options.
         * @param {Object} options - The user options.
         * @returns {Object} The merged options.
         */
        extend(defaults = {}, options = {})
        {
            return Object.
                entries(options).
                reduce((acc, [ k, v ]) =>
                        this.isObject (v) && this.isObject (defaults [k])
                            ? { ...acc, [k]: this.extend(defaults [k], v) }
                            : { ...acc, [k]: v }
                    , defaults
                );
        }

        /**
         * Serialize form data into an object.
         *
         * @param {HTMLFormElement} form - The form element.
         * @returns {FormData|Object} The serialized form data.
         */
        serializeForm(form)
        {
            if (typeof form == 'object' && form.nodeName === "FORM") {
                //    const formEntries = new FormData(html).entries();
                //    return Object.assign(...Array.from(formEntries, ([x,y]) => ({[x]:y})));
                return new FormData(form);
            }
            const inputs = form.querySelectorAll('input, select, textarea');
            const data = {};
            inputs.forEach(input => {
                if (input.type === "checkbox") {
                    data[input.name] = input.checked ? input.value : "";
                } else if (input.type === "radio") {
                    if (!data[input.name]) data[input.name] = "";
                    if (input.checked) data[input.name] = input.value;
                } else if (input.tagName === "SELECT" && input.multiple && input.name.endsWith("[]")) {
                    const sname = input.name.slice(0, -2);
                    input.querySelectorAll("option:checked").forEach((option, j) => {
                        data[`${sname}[${j}]`] = option.value;
                    });
                } else {
                    data[input.name] = input.value;
                }
            });
            return data;
        }

        /**
         * Display an error message box.
         *
         * @param {queryUi} query - The query object.
         */
        displayAlert(query)
        {
            if (!(Object(query) instanceof queryUi)) {
                return console.error('Invalid query object:', query);
            }
            const jqXHR = query.response;
            if (typeof (jqXHR.data) !== 'object' &&
                jqXHR.status === 419 &&
                jqXHR.responseText.indexOf('Page Expired') > 0
            ) {
                return query.ui.showAlertPageExpired();
            }
            if (typeof (jqXHR.data) === 'object' && jqXHR.data?.message) {
                return query.ui.showAlertExtended(jqXHR.data);
            }
            return query.ui.showAlertUnexpected(jqXHR);
        }

        /**
         * Prepare AJAX query parameters.
         *
         * @param {Object} params - The parameters for the query.
         * @returns {queryUi} The prepared query object.
         */
        #prepareQuery(params)
        {
            const query = new queryUi(params);

            if (typeof query.data === 'undefined' && query.method !== 'GET' && query.context instanceof HTMLElement) {
                query.data = this.serializeForm(query.context);
            }
            if (query.data && typeof query.data === 'object' && !(query.data instanceof FormData)) {
                query.data = JSON.stringify(query.data);
                query.headers['Content-Type'] = 'application/json';
            }
            if (!query.contextLock) {query.contextLock = query.context;}
            if (!query.contextStatus) {query.contextStatus = query.context;}

            return query;
        }

        /**
         * Send form data via jQuery AJAX.
         *
         * @param {queryUi} query - The query object.
         * @param {Function} resolve - The resolve function for the promise.
         * @param {Function} reject - The reject function for the promise.
         * @returns {Promise} The jQuery AJAX promise.
         */
        #sendRequestJQuery(query, resolve, reject)
        {
            query.ui.remAlerts();
            query.ui.displayLoader();
            // Use jQuery for AJAX request if available
            return window.jQuery.ajax({
                //url: query.url,
                //method: query.method,
                //headers: query.headers,
                //data: query.data,
                processData: false,
                contentType: false,
                ...query
            }).then((data, textStatus, jqXHR) => {
                query.ui.hideLoader();
                query.addResponse(jqXHR, data);
                if (query.onSuccess) {query.onSuccess.call(query.context, data, query);}
                resolve(query);
            }).fail((jqXHR) => {
                this.#requestFail(jqXHR, query, reject);
            });
        }

        /**
         * Send to fetch if jQuery is not available.
         *
         * @param {queryUi} query - The query object.
         * @param {Function} resolve - The resolve function for the promise.
         * @param {Function} reject - The reject function for the promise.
         * @returns {Promise} The fetch promise.
         */
        #sendRequestFetch(query, resolve, reject)
        {
            query.ui.remAlerts();
            query.ui.displayLoader();
            return fetch(query.url, {
                //method: query.method,
                //headers: query.headers,
                body: query.data,
                ...query
            }).then((response) => {
                query.ui.hideLoader();
                return response.json().then((data) => {
                    if (response.ok) {
                        query.addResponse(response, data);
                        if (query.onSuccess) {query.onSuccess.call(query.context, data, query);}
                        resolve(query);
                    } else {
                        throw { data, status: response.status, statusText: response.statusText };
                    }
                });
            }).catch((jqXHR) => {
                this.#requestFail(jqXHR, query, reject);
            });
        }

        /**
         * Handle AJAX request failure.
         *
         * @param {Object} jqXHR - The jQuery XMLHttpRequest object.
         * @param {queryUi} query - The query object.
         * @param {Function} reject - The reject function for the promise.
         */
        #requestFail(jqXHR, query, reject) {
            query.ui.hideLoader();
            try {
                jqXHR.data = JSON.parse(jqXHR.responseText);
            } catch (e) {}
            query.addResponse(jqXHR, jqXHR.data);
            if (query.onError) {query.onError.call(query.context, jqXHR, query);}
            else {this.displayAlert(query);}
            reject(query);
        }

        /**
         * Load data via AJAX.
         *
         * @param {Object} params - The parameters for the request.
         * @param {string} params.url - The URL for the request.
         * @param {string} [params.method='GET'] - The HTTP method for the request.
         * @param {Object} [params.headers] - The headers for the request.
         * @param {Object} [params.data] - The data to be sent with the request.
         * @param {string} [params.id] - The unique ID of the request.
         * @param {HTMLElement} [params.context] - The context element for the request.
         * @param {Function} [params.onSuccess] - The callback function to be called on success.
         * @param {Function} [params.onError] - The callback function to be called on error.
         * @param {HTMLElement} [params.contextLock=context] - The context element to be locked during the request.
         * @param {HTMLElement} [params.contextStatus=context] - The context element for status messages.
         * @returns {Promise<Object>} The promise for the AJAX request.
         * @returns {Object} return - The queryUi object of request.
         * @returns {Object} return.data - The data sent with the response.
         * @returns {Object} return.response - The response object.
         * @returns {Object} return.responseData - The response data.
         * @returns {Object} return.requestData - The request data.
         * @returns {Object} return.ui - The UI object.
         */
        async request(params)
        {
            const ajaxId = params.id || (new Date().getTime())+'-'+ Math.floor(Math.random() * 0x75bcd15).toString(16);
            const query = this.#prepareQuery(params);
            query.id = ajaxId;
            query.headers['X-Requested-Id'] = ajaxId;
            query.ui = new ui(query);
            return new Promise((resolve, reject) => {
                if (window.jQuery) {
                    this.#sendRequestJQuery(query, resolve, reject);
                } else {
                    this.#sendRequestFetch(query, resolve, reject);
                }
            });
        }

        /**
         * Send a GET request.
         *
         * @param {string} url - The URL for the request.
         * @param {Object} [params] - The parameters for the request.
         * @returns {Promise} The promise for the AJAX request.
         */
        async get(url, params) { return this.request({method: 'GET', url: url, ...params}); }

        /**
         * Send a DELETE request.
         *
         * @param {string} url - The URL for the request.
         * @param {Object} [params] - The parameters for the request.
         * @returns {Promise} The promise for the AJAX request.
         */
        async delete(url, params) { return this.request({method: 'DELETE', url: url, ...params}); }

        /**
         * Send a HEAD request.
         *
         * @param {string} url - The URL for the request.
         * @param {Object} [params] - The parameters for the request.
         * @returns {Promise} The promise for the AJAX request.
         */
        async head(url, params) { return this.request({method: 'HEAD', url: url, ...params}); }

        /**
         * Send an OPTIONS request.
         *
         * @param {string} url - The URL for the request.
         * @param {Object} [params] - The parameters for the request.
         * @returns {Promise} The promise for the AJAX request.
         */
        async options(url, params) { return this.request({method: 'OPTIONS', url: url, ...params}); }

        /**
         * Send a POST request.
         *
         * @param {string} url - The URL for the request.
         * @param {Object} data - The data to be sent with the request.
         * @param {Object} [params] - The parameters for the request.
         * @returns {Promise} The promise for the AJAX request.
         */
        async post(url, data, params) { return this.request({method: 'POST', url: url, ...params}); }

        /**
         * Send a PUT request.
         *
         * @param {string} url - The URL for the request.
         * @param {Object} data - The data to be sent with the request.
         * @param {Object} [params] - The parameters for the request.
         * @returns {Promise} The promise for the AJAX request.
         */
        async put(url, data, params) { return this.request({method: 'PUT', url: url, ...params}); }

        /**
         * Send a PATCH request.
         *
         * @param {string} url - The URL for the request.
         * @param {Object} data - The data to be sent with the request.
         * @param {Object} [params] - The parameters for the request.
         * @returns {Promise} The promise for the AJAX request.
         */
        async patch(url, data, params) { return this.request({method: 'PATCH', url: url, ...params}); }
    }

    // Create an instance of HttpUi
    const instance = new HttpUi();

    // Integrate with jQuery if available
    if (typeof window.jQuery !== 'undefined') {
        window.jQuery.fn.httpUi = instance;
    }

    // Return the instance for module and direct browser usage
    return instance;
}));
