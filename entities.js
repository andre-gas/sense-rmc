const Entities = function () {

    function _EntityList(onChange) {
        this._list = [];
        if (onChange) {
            this._onSelectedChange = onChange.onSelectedChange;
            this._onDelete = onChange.onDelete;
        }
    }

    _EntityList.prototype.getById = function (id) {
        return this._list.find(entity => entity.id === id);
    }

    _EntityList.prototype.getSelected = function () {
        if (!this.selectedId) return null;
        return this.getById(this.selectedId);
    }

    _EntityList.prototype.toggleSelected = function (id) {
        if (!this.getById(id)) return false;
        if (this.selectedId === id) {
            this.selectedId = null;
        } else {
            this.selectedId = id;
        }
        if (this._onSelectedChange) this._onSelectedChange();
        return true;
    }

    _EntityList.prototype.select = function (id) {
        if (!this.getById(id)) return false;
        if (id === this.selectedId) return true;
        this.selectedId = id;
        if (this._onSelectedChange) this._onSelectedChange();
        return true;
    }

    _EntityList.prototype.unselect = function () {
        if (!this.selectedId) return;
        this.selectedId = null;
        if (this._onSelectedChange) this._onSelectedChange();
    }

    _EntityList.prototype.update = function (entity) {
        const ix = this._list.findIndex(cand => cand.id === entity.id);
        let sort = typeof entity.name === 'string';
        if (ix === -1) {
            if (!entity.privileges) throw Error('Missing privileges');
            this._list.push(entity);
        } else {
            if (!entity.privileges) entity.privileges = this._list[ix].privileges;
            if (sort && this._list[ix].name === entity.name) sort = false;
            this._list[ix] = entity;
        }
        if (sort) {
            this._list = this._list.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
        }
    }

    _EntityList.prototype.updateAll = function (list) {
        this._list = list;
        if (this.selectedId && !this.getById(this.selectedId)) {
            this.unselect();
        }
    }

    _EntityList.prototype.removeSelected = function () {
        if (!this.selectedId) return;
        const ix = this._list.findIndex(cand => cand.id === this.selectedId);
        this.unselect()
        if (ix === -1) return;
        const deleted = this._list[ix];
        this._list.splice(ix, 1);
        if (this._onDelete) this._onDelete(deleted);
    }

    _EntityList.prototype.removeByFilter = function (filter) {
        for(;;) {        
            let ix = this._list.findIndex(filter);
            if (ix === -1) break;
            this._list.splice(ix, 1);
        }
        if (this.selectedId && !this.getById(this.selectedId)) {
            this.unselect();
        }
    }

    function _Entities() {
        this._reports = new _EntityList()
    }

    // Backup lista report funzionante
    // _Entities.prototype.loadReport = function () {
    //     return ask('/sharedcontent/full', { query: { privileges: true } })
    //         .then(answers => {
    //             let reports = [];
    //             answers.forEach(answer => {
    //                 reports = reports.concat(answer)
    //             })
    //             reports = reports.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
    //             this._reports.updateAll(reports);
                
    //             // return Promise.resolve(true)
    //         })
    // }
    _Entities.prototype.loadReport = function () {
        return ask('/sharedcontent/full', { query: { privileges: true } })
            .then(answers => {
                let reports = [];
                answers.forEach(answer => {
                    answer.metaData.forEach(metadata => {
                        var metadata_key = metadata.key;
                        delete metadata.key;
                        answer[metadata_key] = metadata.value;
                    })
                    delete answer.metaData;

                    if(answer.type == 'Qlik report') {
                        answer.type = 'NPrinting report'
                    }

                    answer.lastReference = '';
                    answer.references.forEach(reference => {
                        var temp = {};
                        temp.id = reference.id;
                        temp.externalPath = reference.externalPath;
                        creationDate = reference.externalPath.split("/")[3];
                        year = creationDate.substr(0,4);
                        month = creationDate.substr(4,2);
                        day = creationDate.substr(6,2);
                        hour = creationDate.substr(9,2);
                        min = creationDate.substr(11,2);
                        sec = creationDate.substr(13,2);
                        // console.log(year, month - 1, day, hour, min, sec)
                        // creationDate = year.concat("-", month, "-", day, "T", hour, ":", min, ":", sec, "Z");
                        creationDateFormatted = new Date(year.concat("-", month, "-", day, "T", hour, ":", min, ":", sec, "Z")).toISOString();
                        temp.creationDate = creationDateFormatted;
                        // console.log(temp);
                        
                        if(answer.lastReference == '' || answer.lastReference.creationDate < temp.creationDate){
                            answer.lastReference = temp;
                        }
                    })

                    reports = reports.concat(answer)
                })
                reports = reports.sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
                this._reports.updateAll(reports);
                
                console.log(reports);
                return Promise.resolve(true)

            })
    }
   
    _Entities.prototype.getReport = function (id) {
        return this._reports.getById(id);
    }

    _Entities.prototype.getSelectedReport = function () {
        return this._reports.getSelected();
    }

    _Entities.prototype.prepareEditReport = function () {
        const report = this._reports.getSelected();
        return report;
    }

     _Entities.prototype.toggleSelectedReport = function (id) {
        return this._reports.toggleSelected(id);
    }

    _Entities.prototype.selectReport = function (id) {
        return this._reports.select(id);
    }

    _Entities.prototype.updateReport = function (report) {
        this._reports.update(report);
    }

    _Entities.prototype.removeSelectedReport = function () {
        this._reports.removeSelected();
    }

    _Entities.prototype.getReports = function () {
        let reports = this._reports._list;
        const precount = reports.length;
        return {
            count: precount,
            list: reports,
            selectedId: this._reports.selectedId
        }
    }

    return new _Entities();
}();
