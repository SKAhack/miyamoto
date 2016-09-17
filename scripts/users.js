// Users
//

loadUsers = function () {
  var offset = 3;
  var defaultParams = {
    name: '',
    dayoff: '土,日'
  };
  var columnRange = ['A', String.fromCharCode(65 + _.keys(defaultParams).length - 1)];

  var Users = function(spreadsheet, sheetname) {
    if(!sheetname) sheetname = '_ユーザー';

    this.spreadsheet = spreadsheet;
    this._users = {};
    this._all;

    this.sheet = spreadsheet.getSheetByName(sheetname);
    if(!this.sheet) {
      this.sheet = spreadsheet.insertSheet(sheetname);
      this.sheet.getRange('A1:B1').setValues([['名前', '休日']]);
    }
  };

  Users.prototype.get = function(username) {
    if(this._users[username]) {
      return this._users[username];
    }

    var row = _.find(this.getAll(), function(v) {
      return v.name === username;
    });

    var res = {};
    if(row) {
      res = row;
    }

    this._users[username] = res;
    return res;
  };

  Users.prototype.set = function(username, params) {
    if(!params) params = {};

    var row = this.get(username);
    if(row.rowNo) {
      var rowNo = row.rowNo;
    }
    else {
      var rowNo = getLastRow(this.sheet, offset);
      if(this.getAll().length > 0) rowNo += 1;
    }
    row = _.assign({}, defaultParams, row);

    var range = this.sheet.getRange(columnRange[0] + rowNo + ':' + columnRange[1] + rowNo);
    range.setValues([[ username, row.dayoff ]]);
    this._users[username] = undefined;
    this._all = undefined;
  };

  Users.prototype.getUsernames = function() {
    return _.map(this.getAll(), function(v) { return v.name; });
  };

  Users.prototype.getAll = function() {
    if(this._all) return this._all;

    var rowNo = getLastRow(this.sheet, offset);
    var vs = this.sheet.getRange(columnRange[0] + offset + ':' + columnRange[1] + rowNo).getValues();
    this._all = _.chain(vs)
      .map(function(v, k) {
        return {
          rowNo: k + offset,
          name: v[0],
          dayoff: v[1]
        };
      })
      .filter(function(v) { return v.name !== ''; })
      .value();

    return this._all;
  };

  function getLastRow(sheet, offset) {
    var rowNo = sheet.getLastRow();
    if(rowNo <= offset) rowNo = offset;

    return rowNo;
  }

  return Users;
};

if(typeof exports !== 'undefined') {
  exports.loadUsers = loadUsers();
}
