document.getElementById('logout').addEventListener('click', () => {
    fetch('../../qps/user', { method: 'DELETE' })
        .then(res => {
            window.open('../../qps/logout?targetUri=' + document.location.origin + document.location.pathname, '_self');
        })
});

const context = {
    views: []
}

function getView() {
    for (let child = document.getElementById('tabs').firstElementChild; child; child = child.nextElementSibling) {
        const view = Views.find(cand => cand.name === child.dataset.section);
        if (view) {
            view.tab = child;
            view.section = document.getElementById(child.dataset.section + '-section');
            context.views.push(view)
        }
        const edit = Views.find(cand => cand.edit === child.dataset.section);
        if (edit) {
            context.views.push({ name: child.dataset.section, tab: child, section: document.getElementById(child.dataset.section + '-section') })
        }
    }
    let view;
    if (document.location.hash) {
        const name = document.location.hash.substr(1);
        view = context.views.find(view => view.name === name);
    }
    if (!view) view = context.views[0];
    view.tab.classList.toggle('tab-selected', true);
    return view;
}

const selected = {
    view: getView()
}

const RefreshTasks = {
    LoadOnPageLoad: (document.location.hash === '#tasks') ? true : false
}

function toMB(input) {
    const sz = input / (1024 * 1024)
    return sz.toFixed(2)
}

function toDate(input) {
    if (input.startsWith('17')) return ' ';
    const date = new Date(input);
    return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function compareDate(lhs, rhs) {
    const ldate = new Date(lhs);
    const rdate = new Date(rhs);
    return ldate - rdate;
}

function toDuration(input) {
    let ms = input;
    let sec = Math.floor(input / 1000);
    ms = ms % 1000;
    let min = Math.floor(sec / 60);
    sec = sec % 60;
    let hour = Math.floor(min / 60);
    min = min % 60;
    return (hour < 10 ? '0' : '') + hour + ':' + (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec + '.' + (ms < 100 ? ms < 10 ? '00' : '0' : '') + ms;
}

function updateReportTable() {
    const reports = Entities.getReports({ selected: true });
    const reportTable = document.getElementById('report-table');
    reportTable.innerHTML = '';
    reports.list.forEach(report => {
        const row = reportTable.insertRow();
        row.className = 'selectable';
        if (reports.selectedId == report.id) {
            row.classList.toggle('selected', true);
        }
        row.qReport = report.id;
        row.insertCell().textContent = report.name;
    });
}

const reportsState = {
    filters: {},
    sort: {
        index: 0,
        desc: true
    }
}

function updateReportsReportTable() {
    const reports = Entities.getReports({ selected: true });
    document.getElementById('reports-count').textContent = reports.count;
    document.getElementById('reports-filtered-count').textContent = reports.list.length;
    QTable({
        container: 'reports-container',
        columns: [
            { name: 'Name', width: 5, value: report => report.name, title: report => report.id, filter: 'name', sort: (lhs,rhs) => compareTexts(lhs.name, rhs.name) },
            { name: 'Owner', width: 2, value: report => optName(report.owner), filter: 'owner', sort: (lhs,rhs) => compareTexts(optName(lhs.owner), optName(rhs.owner)) },
            { name: 'Last Edit', width: 2, value: report => toDate(report.modifiedDate), sort: (lhs,rhs) => compareDate(lhs.modifiedDate, rhs.modifiedDate) }
        ],
        values: reports.list,
        selected: reports.selectedId,
        onClick: ev => {
            if (Entities.toggleSelectedReport(ev.target.parentNode.qValue)) {
                updateBoard();
            }
        },
        // onDblClick: ev => {
        //     if (Entities.selectReport(ev.target.parentNode.qValue, true)) {
        //         openReportEditDialog();
        //     }
        // },
        state: reportsState,
        counter: 'reports-filtered-count'
    });
}

function updateBoard() {
    if (selected.view.name === 'reports') {
        updateReportsReportTable();
        const selectedReport = Entities.getSelectedReport()
        // document.getElementById('report-open').disabled = !selectedReport;
        // document.getElementById('report-edit-open').disabled = !selectedReport || selectedReport.privileges.indexOf('update') === -1;
        // document.getElementById('report-change-owner-open').disabled = !selectedReport || selectedReport.privileges.indexOf('changeowner') === -1;
        document.getElementById('report-delete-open').disabled = !selectedReport || selectedReport.privileges.indexOf('delete') === -1;
        // document.getElementById('report-publish-open').disabled = !selectedReport || selectedReport.privileges.indexOf('publish') === -1 || selectedReport.stream;
        // document.getElementById('report-move-open').disabled = !selectedReport || selectedReport.privileges.indexOf('publish') === -1 || !selectedReport.stream;
        // document.getElementById('report-import').disabled = !selectedReport;
        // document.getElementById('report-migrate').disabled = !selectedReport || selectedReport.migrated;
        // document.getElementById('report-export-open').disabled = !selectedReport || selectedReport.privileges.indexOf('export') === -1;
        // document.getElementById('report-duplicate').disabled = !selectedReport || selectedReport.privileges.indexOf('duplicate') === -1;
        // document.getElementById('report-reload').disabled = !selectedReport || selectedReport.privileges.indexOf('update') === -1;
        // document.getElementById('report-create-task').disabled = !selectedReport;
    } else if (selected.view.handler && selected.view.handler.updateBoard) {
        selected.view.handler.updateBoard();
    }
    document.getElementById(selected.view.name + '-section').classList.toggle('hidden', false)
    document.getElementById('loading').classList.toggle('hidden', true)
}


QDialog({ name: 'error', level: 'error' });

function editOpen(kind) {
    selected.view.tab.classList.toggle('tab-selected', false);
    selected.view.section.classList.toggle('hidden', true);
    selected.edit = context.views.find(view => view.name === 'edit-' + kind);
    selected.edit.tab.classList.toggle('hidden', false);
    selected.edit.section.classList.toggle('hidden', false);
}

function editClose(basic) {
    if (!selected.edit) return false;
    selected.edit.tab.classList.toggle('hidden', true);
    selected.edit.section.classList.toggle('hidden', true);
    selected.edit = null;
    if (!basic) {
        selected.view.tab.classList.toggle('tab-selected', true);
        selected.view.section.classList.toggle('hidden', false);
    }
    return true;
}

function setFeedback(key, message) {
    const elem = document.getElementById(key + '-feedback');
    if (message) {
        elem.textContent = message;
        elem.classList.toggle('hidden', false);
    } else {
        elem.classList.toggle('hidden', true);
    }
}

// function checkReportInput() {
//     const input = {
//         name: document.getElementById('report-edit-name').value,
//         customProperties: Entities.getReportPropertiesValues(),
//         tags: Entities.getTags()
//     }
//     return input;
// }

// function saveReport(newValues) {
//     const report = Entities.getSelectedReport()
//     return ask('/app/' + report.id, {})
//         .then(answer => {
//             for (let key in newValues) {
//                 answer[key] = newValues[key];
//             }
//             return ask('/app/' + report.id, { method: 'PUT', body: answer, query: { privileges: true } })
//         })
//         .then(answer => {
//             Entities.updateReport(answer)
//         });
// }

// function openReportEditDialog() {
//     const report = Entities.prepareEditReport();
//     document.getElementById('report-edit-name').value = report.name;
//     document.getElementById('report-edit-id').value = report.id;
//     document.getElementById('report-edit-owner').value = report.owner.name;
//     document.getElementById('report-edit-created').value = toDate(report.createdDate);
//     document.getElementById('report-edit-last-modified').value = toDate(report.modifiedDate);
//     document.getElementById('report-edit-file-size').value = toMB(report.fileSize);
//     editOpen('report');
// }

// const notificationPolling = setInterval(checkTimeout, 20000);

// function checkTimeout() {
//     ask('/Notification/changes', { query: { since: '1999-12-31T23:59:59.9999999', types: 'License,ServiceStatus,CustomPropertyDefinition' } })
//         .then(answer => {
//             if (answer && answer.status === 440) {
//                 stopNotificationPolling();
//                 window.location.replace('../../qps/logout?targetUri=' + window.location.href, '_self');
//             }
//         });
// }

// function stopNotificationPolling() {
//     clearInterval(notificationPolling);
// }

function textAndStatus(elem, task) {
    elem.textContent = task.name;
    const icon = document.createElement('span');
    icon.classList.add('task-chain-status');
    icon.classList.add('task-status-' + TaskExecutionStatus[task.operational.lastExecutionResult.status].icon);
    elem.appendChild(icon);
}

function trimFileExtension(fileName) {
    return fileName.split('.').slice(0, -1).join('.');
}

function listUsers() {
    document.getElementById('report-change-owner-status').textContent = 'Loading...'; 
    const body = {
        entity:'User',
        columns:[
            { name: 'id', columnType: 'Property', definition:'id' },
            { name: 'name', columnType: 'Property', definition: 'name' },
            { name: 'userDirectory', columnType: 'Property', definition: 'userDirectory' },
            { name: 'userId', columnType: 'Property', definition: 'userId' },
        ]
    }
    const pageSize = 20;
    const filter = document.getElementById('report-change-owner-filter').value;
    ask('/user/table', { method: 'POST', query: { take: pageSize, filter: 'name so \'' + filter + '\'' }, body: body })
    .then(users => {
        document.getElementById('report-change-owner-status').textContent = (users.rows.length === pageSize ? 'At least ' : '') + users.rows.length + ' users found'; 
        QTable({
            container: 'report-change-owner-body',
            columns: [
                { name: 'Name', width: 5, value: item => item[1] },
                { name: 'UserId', width: 3, value: item => item[3] },
                { name: 'UserDirectory', width: 3, value: item => item[2] },
            ],
            values: users.rows,
            useObject: true,
            onClick: ev => {
                if (selected.userElement) selected.userElement.classList.toggle('selected', false);
                selected.userElement = ev.target.parentNode; 
                if (selected.userElement) selected.userElement.classList.toggle('selected', true);
                const item = ev.target.parentNode.qValue;
                document.getElementById('report-change-owner-ok').disabled = !item;
                document.getElementById('report-change-owner-ok').qValue = item;
            }
        })
        document.getElementById('report-change-owner-body').classList.toggle('hidden', false);
    })
    .catch(reason => {
        document.getElementById('report-change-owner-status').textContent = 'Failed to load users'; 
        QShowError('Failed to load users: ' + reason);
    })
}

fetch('../../qps/user')
    .then(res => res.json())
    .then(answer => {
        context.user = answer;
        document.getElementById('login').textContent = context.user.userName;
        return Entities.loadReport();
    })
    .then(() => {
        updateBoard();
        context.views.forEach(view => {
            if (view.handler && view.handler.init) {
                view.handler.init(context.user);
            }
        })

        document.getElementById('tabs').addEventListener('click', ev => {
            if (ev.target.classList.contains('tab') && !ev.target.classList.contains('tab-selected')) {
                if (!editClose(true)) {
                    selected.view.tab.classList.toggle('tab-selected', false);
                    selected.view.section.classList.toggle('hidden', true);
                }
                selected.view = context.views.find(view => view.tab === ev.target);
                selected.view.tab.classList.toggle('tab-selected', true);
                selected.view.section.classList.toggle('hidden', false);
                document.location.hash = selected.view.name;
                updateBoard();
            }
        });
        QDialog({
            name: 'report-delete',
            populate: () => {
                document.getElementById('report-to-be-deleted').textContent = Entities.getSelectedReport().name;
            },
            action: close => {
                close();
                ask('/sharedcontent/' + Entities.getSelectedReport().id, { method: 'DELETE' })
                    .then(() => {
                        Entities.removeSelectedReport()
                        updateBoard();
                    })
                    .catch(reason => {
                        console.log(reason);
                        QShowError('Failed to delete report: ' + reason);
                    })
            }
        });

        // document.getElementById('report-open').addEventListener('click', ev => {
        //     const selectedReport = Entities.getSelectedReport()
        //     if (selectedReport) {
        //         window.open('../../sense/app/' + selectedReport.id, '_blank');
        //     }
        // })
        document.getElementById('qmc').addEventListener('click', ev => {
            window.open('../../qmc', '_blank');
        })
        document.getElementById('hub').addEventListener('click', ev => {
            window.open('../../hub', '_blank');
        })
        document.getElementById('refresh').addEventListener('click', ev => {
            editClose()
            document.getElementById(selected.view.name + '-section').classList.toggle('hidden', true)
            document.getElementById('loading').classList.toggle('hidden', false);
            Entities.loadReport(true)
                .then(() => {
                    updateBoard();
                })
                .catch(reason => {
                    QShowError('Failed to create refresh: ' + reason)
                })
        })
        // document.getElementById('report-edit-open').addEventListener('click', ev => {
        //     if (Entities.getSelectedReport()) {
        //         openReportEditDialog()
        //     }
        // })
        // document.getElementById('report-edit-ok').addEventListener('click', ev => {
        //     const newValues = checkReportInput();
        //     if (!newValues) {
        //         editClose();
        //         updateBoard();
        //     }
        //     else {
        //         saveReport(newValues)
        //             .then(() => {
        //                 editClose();
        //                 updateBoard();
        //             })
        //             .catch(reason => {
        //                 QShowError('Failed to update report: ' + reason);
        //             });
        //     }
        // })
        // document.getElementById('report-edit-assign-to-me').addEventListener('click', ev => {
        //     fetch('../../qrs/user?filter=' + encodeURIComponent('userDirectory eq \'' + context.user.userDirectory + '\' and userId eq \'' + context.user.userId + '\'') + '&xrfkey=' + xrfkey, { headers: { 'X-Qlik-XrfKey': xrfkey } })
        //         .then(res => res.json())
        //         .then(user => {
        //             return saveReport({ owner: { id: user[0].id } })
        //         })
        //         .then(() => {
        //             editClose();
        //             updateBoard();
        //         })
        //         .catch(reason => {
        //             QShowError('Failed to update report: ' + reason);
        //         })
        // })
        // document.getElementById('report-edit-apply').addEventListener('click', ev => {
        //     const newValues = checkReportInput();
        //     if (newValues) {
        //         saveReport(newValues)
        //             .catch(reason => {
        //                 QShowError('Failed to update report: ' + reason);
        //             });
        //     }
        // });

        // document.getElementById('report-change-owner-filter').addEventListener('keypress', ev => {
        //     console.log(ev.keyCode);
        //     if (ev.keyCode === 13) listUsers();
        // })

        // document.getElementById('report-change-owner-filter').addEventListener('input', ev => {
        //     console.log(ev);
        //     document.getElementById('report-change-owner-status').textContent = 'Press enter to perform the search'; 
        // })

        // QDialog({
        //     name: 'report-change-owner',
        //     populate: () => {
        //         document.getElementById('report-change-owner-ok').disabled = true;
        //         document.getElementById('report-change-owner-ok').qValue = null;
        //         const elem = document.getElementById('report-change-owner-filter');
        //         if (selected.userElement) selected.userElement.classList.toggle('selected', false);
        //         setTimeout(() => elem.focus(), 0)
        //     },
        //     action: close => {
        //         const item = document.getElementById('report-change-owner-ok').qValue;
        //         if (item) {
        //             const userid = item[0];
        //             saveReport({ owner: { id: userid } })
        //             .then(() => {
        //                 close();
        //                 updateBoard();
        //             })
        //             .catch(reason => {
        //                 QShowError('Failed to update owner: ' + reason);
        //             })
        //         } else {
        //             close()
        //         }
        //     }
        // })

        // document.getElementById('report-edit-cancel').addEventListener('click', ev => {
        //     editClose();
        //     updateBoard();
        // });
        // document.getElementById('report-duplicate').addEventListener('click', ev => {
        //     const report = Entities.getSelectedReport()
        //     if (report) {
        //         ask('/app/' + report.id + '/copy', { method: 'POST' })
        //             .then(answer => {
        //                 return ask('/app/' + answer.id, { query: { privileges: true } });
        //             })
        //             .then(answer => {
        //                 Entities.updateReport(answer); 
        //                 updateBoard();
        //             })
        //             .catch(reason => {
        //                 QShowError('Failed to duplicate report');
        //             })
        //     }
        // })
        // QDialog({
        //     name: 'report-export',
        //     populate: () => {
        //         document.getElementById('report-export-with-data').checked = true;
        //     },
        //     action: close => {
        //         const withData = document.getElementById('report-export-with-data').checked;
        //         const selectedReport = Entities.getSelectedReport();
        //         if (selectedReport) {
        //             const token =  uuidv4();
        //             ask('/app/' + selectedReport.id + '/export/' + token, { method: 'POST', query: { skipData: !withData } })
        //                 .then(answer => {
        //                     window.open('../..' + answer.downloadPath);
        //                 })
        //                 .catch(reason => {
        //                     QShowError('Failed to export report: ' + reason);
        //                 })
        //         }
        //         close();
        //     }
        // })
        // document.getElementById('report-import-file').addEventListener('change', ev => {
        //     const file = document.getElementById('report-import-file').files[0];
        //     document.getElementById('report-import-name').value = trimFileExtension(file.name);
        // });
        // QDialog({
        //     name: 'report-import',
        //     populate: () => { },
        //     action: close => {
        //         const file = document.getElementById('report-import-file').files[0];
        //         if (file) {
        //             close();
        //             const name = document.getElementById('report-import-name');
        //             Working.start('Importing...');
        //             ask('/app/upload', { method: 'POST', mime: 'application/vnd.qlik.sense.app', body: file, query: { name: name.value || trimFileExtension(file.name), privileges: true } })
        //                 .then(answer => {
        //                     Entities.updateReport(answer)
        //                     updateBoard();
        //                 })
        //                 .catch(reason => {
        //                     QShowError('Failed to import report: ' + reason);
        //                 })
        //                 .finally(() => {
        //                     Working.close();
        //                 });
        //         }
        //     }
        // });
    })
    .catch(err => {
        document.getElementById('status').textContent = 'Access denied';
        console.log(err);
    })
