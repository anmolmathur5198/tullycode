const fs = require('fs');
const { resolve } = require('path');
const path = require('path');
const crypto = require("crypto");
class Filehandle {
    constructor(filename, filepath = 'database') {
        if (!filename) throw new Error('Create a repository');
        this.filename = filepath + '/' + filename;
    }
    async checkForFile() {
        try {
            fs.accessSync(this.filename);
        } catch (err) {
            fs.writeFileSync(this.filename, '[]');
        }
    }
    async getAll() {
        const contents = await fs.readFileSync(this.filename, { encoding: 'utf-8' });
        return contents;

    }

    async create(attr) {
        attr.id = await this.randomID();
        const records = await this.getAll();
        var newrecords = JSON.parse(records);
        newrecords.push(attr);
        await fs.promises.writeFile(this.filename, JSON.stringify(newrecords, null, 2));
    }
    async delete(id) {

        var records = await this.getAll();
        records = JSON.parse(records);
        var record = records.find(record => record.id == id);
        var index = records.indexOf(record);
        if (index > -1)
            records.splice(index, 1)
        await this.writeAll(records);

    }
    async deleteMultiData(...data) {
        let records = "";
        await this.asyncforEach(data[0], async(item, index) => {
            var records = await this.getAll();
            records = await JSON.parse(records);

            var record = await records.find(record => record.id == item);
            var index = await records.indexOf(record);
            if (index > -1)
                await records.splice(index, 1)
            await fs.promises.writeFile(this.filename, JSON.stringify(records, null, 2));
        });
    }
    async asyncforEach(array, callback) {
            for (let index = 0; index < array.length; index++) {

                await callback(array[index], index, array);
            }
        }
        //    randomID = () => crypto.randomBytes(10).toString('hex');
    writeAll(record) {
        fs.promises.writeFile(this.filename, JSON.stringify(record, null, 2));
    }
    async update(attr) {

        let id = attr.id;
        var records = await this.getAll();
        records = JSON.parse(records);
        const record = records.find(record => record.id === id);
        if (!record) throw new Error(`Record with id ${id} not found`);
        Object.assign(record, attr);

        await this.writeAll(records);
    }
    async getByOne(filter) {
        const records = await this.getAll();
        records = JSON.parse(records);
        let index = await records.findIndex(record => record.id == filter.id);
        return index >= 0 ? true : false;

    }

}
module.exports = Filehandle;