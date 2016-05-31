"use strict";

var fs = require("fs");
var uuid = require("node-uuid");

class Database {

    constructor() {
        this.tables = {};
        this.ids = {};
        this.writeTimeout = null;
    }

    setObject(type, obj)
    {
        if(!this.tables[type])
        {
            this.tables[type] = [];
        }
        if(!this.ids[type]) {
            this.ids[type] = 0;
        }

        var o = {id:obj.id};
        if(!o.id) {
            o.id = this.ids[type]++;
        }
        if(!obj.uuid)
        {
            obj.uuid = uuid.v4();
        }
        o.type = type;
        o.attributes = obj;
        this.tables[type][o.id] = o;
        this.save();
        return o;
    }

    update(type, obj)
    {
        if(!this.tables[type])
        {
            this.tables[type] = [];
        }

        this.tables[type][obj.id] = obj;
        this.save();
        return obj;
    }

    fileExists(type, id)
    {
        return !!this.tables[type]&&!!this.tables[type][id];
    }

    findBy(type, key, value)
    {
        var table = this.tables[type];
        if(!table) {
            return [];
        }

        var items = [];
        for(var itemKey in table)
        {
            if(table[itemKey]&&table[itemKey].attributes[key]===value)
            {
                items.push(table[itemKey]);
            }
        }
        return items;
    }

    findByMatchFilters(type, filters)
    {
        var table = this.tables[type];
        if(!table) {
            return [];
        }
        var filterProps = {};

        // loop over the filters and apply search arguments
        // %test%       match test somwhere in the string
        // test%        starts with test
        // %test        ends with test
        for(var key in filters)
        {
            var type = "normal";
            var a = filters[key][0]=="%";
            var b = filters[key][filters[key].length-1]=="%";
            if(a&&b)
            {
                type = "search";
                filters[key] = filters[key].substring(1, filters[key].length-1);
                console.log(filters[key]);
            }else if(a)
            {
                type = "endsWith";
                filters[key] = filters[key].substring(1);
            }else if(b)
            {
                type = "startsWith";
                filters[key] = filters[key].substring(0, filters[key].length-1);
            }
            filterProps[key] = type;
            filters[key] = filters[key].toLowerCase();
        }

        var numFilters = 0;
        for(var filterKey in filters)
        {
            numFilters++;
        }

        var items = [];
        for(var itemKey in table)
        {
            var item = table[itemKey];
            var match = 0;
            for(var filterKey in filters)
            {

                if (!this.matches(
                            item.attributes[filterKey].toLowerCase(),
                            filters[filterKey],
                            filterProps[filterKey]
                        )
                    )
                {
                    break;
                }
                match++;
            }
            if(match===numFilters) {
                items.push(item);
            }
        }
        return items;
    }

    matches(value, filter, filterProp)
    {
        //console.log(filterProp);
        switch(filterProp)
        {
            case "endsWith":
                return value.indexOf(filter)+filter.length===value.length;
            case "startsWith":
                return value.indexOf(filter)===0;
            case "search":
                return value.indexOf(filter)>=0;
            case "normal":
                return value===filter;
        }
    }

    getById(type, id)
    {
        if(!this.tables[type])
            return null;
        return this.tables[type][id];
    }

    getAll(type)
    {
        if(!this.tables[type]) {
            this.tables[type] = [];
        }

        return this.tables[type].slice();
    }

    load()
    {
        try {
            if (fs.existsSync('db')) {
                var items = JSON.parse(fs.readFileSync("db", "utf8"));
                for (var key in items) {
                    this[key] = items[key];
                }
            }
        }catch(e){
            console.log(e);
        }
    }

    save()
    {
        if(this.writeTimeout)
            clearTimeout(this.writeTimeout);
        this.writeTimeout = setTimeout(this.doSave.bind(this), 3000);
    }

    doSave()
    {
        console.log("Did write db");
        this.writeTimeout = null;
        fs.writeFile("db", JSON.stringify(this));
    }
}

var db = new Database();
db.load();

module.exports = db;
