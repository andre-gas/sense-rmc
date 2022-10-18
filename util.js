const Views = [
    { name: 'reports', edit: 'edit-reports' }
]
var xrfkey = MakeXrfkey();

function MakeXrfkey() {
    // const version = '0.7.1';
    // var versionComponents = version.split('.');
    // var xrfkey = 'cxAMCy';
  
    // if (versionComponents.length === 1) {
    //     xrfkey += version;
    // } else {
    //     xrfkey += versionComponents[0] + 'g' + versionComponents[1] + 'g' + versionComponents[2] + 'panbei25';
    // }
    var xrfkey = '0123456789abcdef'

    return xrfkey.substr(0, 16);
}

function ask(url, args) {
    const options = {
        method: args.method || 'GET',
        headers: { 'X-Qlik-XrfKey': xrfkey }
    }
    let query = '?xrfkey=' + xrfkey;
    if (args.query) {
        for (let key in args.query) {
            query += '&' + key + '=' + encodeURIComponent(args.query[key])
        }
    }
    if (args.mime) {
        options.headers['content-type'] = args.mime;
        options.body = args.body;
    } else if (args.body) {
        options.headers['content-type'] = 'application/json';       
        options.body = JSON.stringify(args.body);
    }
    return fetch('../../qrs' + url + query, options)
        .then(res => {
            if (res.status === 204) {
                return {}
            } else if (res.status === 200 || res.status === 201) {
                return res.json()
            } else if (res.status === 440) {
                return res;
            } else {
                return Promise.reject(res.statusText);
            }
        })
}

const Working = function() {
    function start(text) {
        document.getElementById('working-text').textContent = text;
        document.getElementById('working-section').classList.toggle('hidden', false);
    }
    function close() {
        document.getElementById('working-section').classList.toggle('hidden', true);
    }
    return {
        start,
        close
    }
}()

function QTable(options) {
    const selected = options.onSelect ? {} : null;
    const container = document.getElementById(options.container);
    const hasSort = options.columns.find(column => column.sort);
    const hasFilter = options.columns.find(column => column.filter);
    const filters = hasFilter ? options.columns.map(column => {
        if (!(column.filter in options.state.filters)) options.state.filters[column.filter] = '';
        return column.filter; 
    }) : null;
    const dataValues = options.values.map(value => value);
    function doSort() {
        if (hasSort) {
            dataValues.sort((lhs, rhs) => {
                const func = options.columns[options.state.sort.index].sort;
                return options.state.sort.desc ? func(lhs, rhs) : -func(lhs, rhs)
            })
        }
    }
    doSort();
    function rowIsHidden(row) {
        return filters && !!filters.find((filter, ix) => filter && row.childNodes[ix].textContent.toLowerCase().indexOf(options.state.filters[filter]) === -1)
    }
    function hideRows() {
        let count = 0;
        for (let row = container.lastElementChild.firstElementChild; row; row = row.nextElementSibling) {
            const hidden = rowIsHidden(row);
            if (!hidden) ++count;
            row.classList.toggle('hidden', hidden);
            // TBD? what if the selected becomes invisible?
        }
        if (options.counter) document.getElementById(options.counter).textContent = count;
    }
    function addRow(section, columns, totwidth, value, isFilterRow) {
        const row = document.createElement('div');
        if (value) {
            row.className = 'table-body-row';
            row.qValue = options.useObject ? value : value.id;
            if (options.selected && options.selected === (options.useObject ? value : value.id)) {
                row.classList.toggle('selected', true)
                if (selected) selected.row = row;
            }
        }
        columns.forEach((column, ix) => {
            const cell = document.createElement('div');
            cell.className = 'table-cell';
            cell.style.width = (column.width / totwidth) + '%';
            if (column.align) cell.style.textAlign = column.align;
            if (!isFilterRow) {
                cell.textContent = value ? column.value(value) : column.name;
                if (value && column.title) cell.title = column.title(value)
                if (!value && column.sort) {
                    const sort = document.createElement('b');
                    sort.classList.add('sort-icon');
                    if (ix === options.state.sort.index) {
                        if (options.state.sort.desc) {
                            sort.classList.add('sort-desc');
                        } else {
                            sort.classList.add('sort-asc');
                        }
                    } else {
                        sort.classList.add('sort-desc');
                        sort.classList.add('sort-pending');
                    }
                    sort.qColIx = ix;
                    sort.onclick = ev => {
                        if (ev.target.qColIx === options.state.sort.index) {
                            options.state.sort.desc = !options.state.sort.desc;
                        } else {
                            const prev = ev.target.parentNode.parentNode.childNodes[options.state.sort.index].lastElementChild;
                            prev.classList.toggle('sort-asc', false);
                            prev.classList.toggle('sort-desc', true);
                            sort.classList.toggle('sort-pending', true);
                            options.state.sort.index = ev.target.qColIx;
                            options.state.sort.desc = true;
                            sort.classList.toggle('sort-pending', false);
                        }
                        if (options.state.sort.desc) {
                            sort.classList.toggle('sort-asc', false);
                            sort.classList.toggle('sort-desc', true);
                        } else {
                            sort.classList.toggle('sort-desc', false);
                            sort.classList.toggle('sort-asc', true);
                        }
                        updateRows();
                    }
                    cell.appendChild(sort);
                }
            } else {
                if (column.filter) {
                    const box = document.createElement('input');
                    box.className = 'table-cell-filter';
                    box.value = options.state.filters[column.filter];
                    box.qColIx = ix;
                    box.onkeyup = ev => {
                        options.state.filters[filters[ev.target.qColIx]] = ev.target.value;
                        hideRows();
                    }
                    cell.appendChild(box);
                }
            }
            row.appendChild(cell);
        })
        section.appendChild(row)
    }
    function updateRow(row, columns, value) {
        columns.forEach((column, ix) => {
            const cell = row.childNodes[ix];
            cell.textContent = column.value(value);
        })
    }
    function updateRows() {
        doSort();
        container.innerHTML = '';
        let totwidth = 0;
        options.columns.forEach(column => {
            totwidth += column.width;
        })
        totwidth /= 100;

        const headSection = document.createElement('div');
        headSection.className = 'table-head';

        addRow(headSection, options.columns, totwidth);
        if (options.columns.find(column => column.filter)) {
            addRow(headSection, options.columns, totwidth, null, true);
        }
        container.appendChild(headSection)

        const bodySection = document.createElement('div');
        bodySection.className = 'table-body';

        // console.log('DEBUG updateRows', dataValues);
        dataValues.forEach(value =>  {
            addRow(bodySection, options.columns, totwidth, value);
        })

        container.appendChild(bodySection)

        if (selected) {
            bodySection.addEventListener('click', ev => {
                const row = ev.target.parentNode;
                const qVal = row.qValue;
                if (!qVal) return;
                if (selected.row) selected.row.classList.toggle('selected', false);
                selected.row = row;
                selected.row.classList.toggle('selected', true);
                options.onSelect(qVal)
            })
        } else {
            bodySection.addEventListener('click', options.onClick)
            if (options.onDblClick)
                bodySection.addEventListener('dblclick', options.onDblClick)    
        }
        hideRows();
    }
    let done = false;
    if (container.lastElementChild && container.lastElementChild.childElementCount === dataValues.length) {
        done = true;
        const bodySection = container.lastElementChild;
        dataValues.forEach((value, ix) =>  {
            if (!done) return;
            const row = bodySection.childNodes[ix];
            if (row.qValue !== (options.useObject ? value : value.id)) {
                done = false;
                return;
            }
            row.classList.toggle('selected', options.selected  === (options.useObject ? value : value.id));
            updateRow(row, options.columns, value);
        })
    }
    if (!done) {
        updateRows();
    }
}

function QDialog(options) {
    const background = document.getElementById('modal-background' + (options.level ? '-' + options.level : ''))
    document.getElementById(options.name + '-cancel').addEventListener('click', ev => {
        document.getElementById(options.name + '-dialog').classList.toggle('hidden', true)
        background.classList.toggle('hidden', true)
    })
    
    const okBtn = document.getElementById(options.name + '-ok');
    if (okBtn) okBtn.addEventListener('click', ev => {
        options.action(() => {
            background.classList.toggle('hidden', true)
            document.getElementById(options.name + '-dialog').classList.toggle('hidden', true)    
        })
    })

    const openBtn = document.getElementById(options.name + '-open')
    if (openBtn) openBtn.addEventListener('click', ev => {
        if (options.populate) options.populate();
        background.classList.toggle('hidden', false)
        document.getElementById(options.name + '-dialog').classList.toggle('hidden', false)
    })

    if (options.alt) {
        document.getElementById(options.alt).addEventListener('click', ev => {
            if (options.populate) options.populate();
            background.classList.toggle('hidden', false)
            document.getElementById(options.name + '-dialog').classList.toggle('hidden', false)
        })
    }
}

function QOpenDialog(options) {
    const background = document.getElementById('modal-background' + (options.level ? '-' + options.level : ''))
    function close() {
        document.getElementById(options.name + '-dialog').classList.toggle('hidden', true)
        background.classList.toggle('hidden', true)
    }
    document.getElementById(options.name + '-cancel').onclick = close;
    
    const okBtn = document.getElementById(options.name + '-ok');
    if (okBtn) okBtn.onclick = ev => {
        options.action(() => {
            background.classList.toggle('hidden', true)
            document.getElementById(options.name + '-dialog').classList.toggle('hidden', true)    
        })
    }
    if (options.populate) options.populate(close);
    background.classList.toggle('hidden', false)
    document.getElementById(options.name + '-dialog').classList.toggle('hidden', false)
}

function QShowError(msg) {
    document.getElementById('modal-background-error').classList.toggle('hidden', false)
    document.getElementById('error-message').textContent = msg;
    document.getElementById('error-dialog').classList.toggle('hidden', false)
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function QCustomProperties (resourceType, dlgId, columns) {
    function _QCustomProperties(props) {
        this.props = props;
    }

    _QCustomProperties.prototype.getValues = function() {
        const values = [];
        this.props.forEach(prop => {
            for(let opt = prop.elem.firstElementChild; opt; opt = opt.nextElementSibling) {
                values.push({ definition: { id: prop.id }, value: opt.value })
            };
        });
        return values;
    }

    function _addPropertyRow(input, val) {
        const opt = document.createElement('div');
        opt.className = 'custom-properties-value'
        opt.textContent = val;
        opt.value = val;
        const cb = document.createElement('span');
        cb.title = 'Delete this value'
        cb.className = 'custom-properties-delete'
        opt.appendChild(cb);
        input.appendChild(opt);
    }

    _QCustomProperties.prototype.setValues = function(selected) {
        this.props.forEach(prop => {
            prop.elem.innerHTML = '';
            selected.customProperties.filter(cand => cand.definition.id === prop.id).map(cand => cand.value).sort((a, b) => a.localeCompare(b)).forEach(cand => {
                _addPropertyRow(prop.elem, cand);
            })
            prop.count.textContent = ' (' + prop.elem.childElementCount + ')';
        });
    }
    function propsToText(props, pid) {
        return props.filter(cand => cand.definition.id === pid).map(cand => cand.value).join(', ')
    }

    return ask('/CustomPropertyDefinition/full', {
        query: { filter: 'objectTypes eq \'' + resourceType +'\'' }
    })
    .then(list => {
        if (list.length === 0) return [];
        const container = document.getElementById(dlgId).firstElementChild;
        const head = document.createElement('div');
        head.className = 'dialog-section-head'
        head.textContent = 'Custom properties'
        container.appendChild(head)
        const section = document.createElement('div');
        section.className = 'dialog-section-scrollable'
        container.appendChild(section)
        return list.map(prop => {
            if (columns) {
                columns.push({ 
                    name: prop.name, 
                    width: 3, 
                    value: item => propsToText(item.customProperties, prop.id),
                    filter: '_' + prop.name
                });
            }
            const row = document.createElement('div')
            row.className = 'dialog-section-row';
            const label = document.createElement('span')
            label.textContent = prop.name;
            const count = document.createElement('i');
            count.className = 'dialog-section-count';
            label.appendChild(count);
            const add = document.createElement('span');
            add.className = 'custom-properties-add';
            add.title = 'Add a value'
            label.appendChild(add);
            row.appendChild(label);
            const input = document.createElement('div')
            input.className = 'custom-properties-values-box';
            input.addEventListener('click', ev => {
                if (ev.target.tagName !== 'SPAN') return;
                const row = ev.target.parentNode;
                const box = row.parentNode;
                box.removeChild(row);
                count.textContent = ' (' + box.childElementCount + ')';
            })
            add.addEventListener('click', ev => {
                const elem = input;
                const all = prop.choiceValues.sort((a, b) => a.localeCompare(b));
                QOpenDialog({ name: 'custom-property-value', populate: (close) => {
                    const selected = []
                    for(let opt = elem.firstElementChild; opt; opt = opt.nextElementSibling) {
                        selected.push(opt.value)
                    };
                    const filter = document.getElementById('custom-property-value-filter');
                    const table = document.getElementById('custom-property-value-list');
                    function drawTable() {
                        table.innerHTML = '';
                        const fval = filter.value.toLowerCase();
                        all.filter(cand => cand.toLowerCase().indexOf(fval) !== -1).forEach(cand => {
                            if (selected.indexOf(cand) !== -1) return;
                            const row = document.createElement('div');
                            row.className = 'custom-property-value-row';
                            row.innerText = cand;
                            row.value = cand;
                            table.appendChild(row);
                        })
                    }
                    drawTable();
                    filter.onkeyup = ev => {
                        drawTable();
                    }
                    table.onclick = ev => {
                        if (!ev.target.value) return;
                        _addPropertyRow(elem, ev.target.value);
                        close();
                    }
                }})
            })
            row.appendChild(input);
            section.appendChild(row);
            return { id: prop.id, elem: input, count };
        })
    })
    .then(props => new _QCustomProperties(props))
}



function QTags (dlgId) {
    function _QTags(prop) {
        this.elem = prop.elem;
        this.count = prop.count;
    }

    _QTags.prototype.getValues = function() {
        const values = [];
        for(let opt = this.elem.firstElementChild; opt; opt = opt.nextElementSibling) {
            values.push({ id: opt.value, name: opt.textContent })
        };
        return values;
    }

    function _addTagRow(input, name, id) {
        const opt = document.createElement('div');
        opt.className = 'custom-properties-value'
        opt.textContent = name;
        opt.value = id;
        const cb = document.createElement('span');
        cb.title = 'Delete this value'
        cb.className = 'custom-properties-delete'
        opt.appendChild(cb);
        input.appendChild(opt);
    }

    _QTags.prototype.setValues = function(selected) {
        this.elem.innerHTML = '';
        selected.tags.sort((a, b) => a.name.localeCompare(b.name)).forEach(cand => {
            _addTagRow(this.elem, cand.name, cand.id);
        })
        this.count.textContent = ' (' + this.elem.childElementCount + ')';
    }

    return ask('/tag', {})
    .then(list => {
        this.tagList = list.sort((a, b) => a.name.localeCompare(b.name));
        const container = document.getElementById(dlgId).firstElementChild;
        const head = document.createElement('div');
        head.className = 'dialog-section-head'
        head.textContent = 'Tags'
        container.appendChild(head)
        const row = document.createElement('div')
        row.className = 'dialog-section-row';
        const label = document.createElement('span')
        const count = document.createElement('i');
        count.className = 'dialog-section-count';
        label.appendChild(count);
        const add = document.createElement('span');
        add.className = 'custom-properties-add';
        add.title = 'Add a value'
        label.appendChild(add);
        row.appendChild(label);
        const input = document.createElement('div')
        input.className = 'custom-properties-values-box';
        input.addEventListener('click', ev => {
            if (ev.target.tagName !== 'SPAN') return;
            const row = ev.target.parentNode;
            const box = row.parentNode;
            box.removeChild(row);
            count.textContent = ' (' + box.childElementCount + ')';
        })
        add.addEventListener('click', ev => {
            const elem = input;
            const all = this.tagList;
            QOpenDialog({ name: 'custom-property-value', populate: (close) => {
                const selected = []
                for(let opt = elem.firstElementChild; opt; opt = opt.nextElementSibling) {
                    selected.push(opt.value)
                };
                const filter = document.getElementById('custom-property-value-filter');
                const table = document.getElementById('custom-property-value-list');
                function drawTable() {
                    table.innerHTML = '';
                    const fval = filter.value.toLowerCase();
                    all.filter(cand => cand.name.toLowerCase().indexOf(fval) !== -1).forEach(cand => {
                        if (selected.indexOf(cand.id) !== -1) return;
                        const row = document.createElement('div');
                        row.className = 'custom-property-value-row';
                        row.innerText = cand.name;
                        row.value = cand.id;
                        table.appendChild(row);
                    })
                }
                drawTable();
                filter.onkeyup = ev => {
                    drawTable();
                }
                table.onclick = ev => {
                    if (!ev.target.value) return;
                    _addTagRow(elem, ev.target.textContent, ev.target.value);
                    close();
                }
            }})
        })
        row.appendChild(input);
        container.appendChild(row);
        return { elem: input, count };
    })
    .then(prop => new _QTags(prop))
}

function optName(item) {
    return item ? item.name : '';
}

function tagsToText(tags) {
    return tags.map(tag => tag.name).sort((a, b) => a.localeCompare(b)).join(', ');
}

function compareTexts(lhs, rhs) {
    return lhs.toLowerCase().localeCompare(rhs.toLowerCase());
}

function appIdOfTask(task) {
    if (task.app) return task.app.id;
    return task.parameters.split(' ')[0];
}

function dataIdOfTask(task) {
    return task.parameters ? task.parameters.split(' ')[1] : null;
}

function writeTaskConfig(sharedId, config) {
    return ask('/sharedcontent/' + sharedId + '/uploadfile', { method: 'POST',  query: { externalpath: 'config.json' }, body: config });
}

function showLog(logfile, logFileName) {
    logfile.blob().then(content => {
        if (navigator.msSaveBlob) {
            return navigator.msSaveBlob(content, logFileName);
        } else {
            let link = document.createElement('a');
            link.href = window.URL.createObjectURL(content);
            link.download = logFileName;
            document.body.appendChild(link);
            link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
            link.remove();
            window.URL.revokeObjectURL(link.href);
        }
    })
}
