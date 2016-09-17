// Users
//

loadUsers = function () {
  var offset = 3;
  var Users = function(spreadsheet, sheetname) {
    if(!sheetname) sheetname = '_ユーザー';

    this.spreadsheet = spreadsheet;
    this._users = {};
    this._all;

    this.sheet = spreadsheet.getSheetByName(sheetname);
    if(!this.sheet) {
      this.sheet = spreadsheet.insertSheet(sheetname);
      this.sheet.getRange('A1').setValue('名前');
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
    if(row) res = row;

    this._users[username] = res;
    return res;
  };

  Users.prototype.set = function(username) {
    var row = this.get(username);
    if(row.rowNo) {
      var rowNo = row.rowNo;
    }
    else {
      var rowNo = getLastRow(this.sheet, offset) + 1;
    }

    var range = this.sheet.getRange('A' + rowNo);
    range.setValue(username);
    this._users[username] = undefined;
    this._all = undefined;
  };

  Users.prototype.getAll = function() {
    if(this._all) return this._all;

    var rowNo = getLastRow(this.sheet, offset);
    var vs = this.sheet.getRange('A' + offset + ':A' + rowNo).getValues();
    return _.chain(vs)
      .map(function(v, k) {
        return {
          rowNo: k + offset,
          name: v[0]
        };
      })
      .filter(function(v) { return v.name !== ''; })
      .value();
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
