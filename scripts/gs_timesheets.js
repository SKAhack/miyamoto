// 入力内容を解析して、メソッドを呼び出す
// Timesheets = loadTimesheets();

loadGSTimesheets = function () {
  var offset = 3;
  var columnRange;

  var GSTimesheets = function(spreadsheet, users, settings, sheetname) {
    if(!sheetname) sheetname = 'kintai';

    this.spreadsheet = spreadsheet;
    this.users = users;
    this.settings = settings;
    this._sheets = {};

    this.scheme = {
      columns: [
        { name: '名前' },
        { name: '日付' },
        { name: '出勤' },
        { name: '退勤' },
        { name: 'ノート' },
      ]
    };
    columnRange = ['A', String.fromCharCode(65 + this.scheme.columns.length - 1)];

    this.sheet = this._getSheet(sheetname);
  };

  GSTimesheets.prototype._getSheet = function(sheetname) {
    if(this._sheets[sheetname]) return this._sheets[sheetname];

    var sheet = this.spreadsheet.getSheetByName(sheetname);
    if(sheet) {
      this._sheets[sheetname] = sheet;
      return sheet;
    }

    sheet = this.spreadsheet.insertSheet(sheetname);
    if(!sheet) {
      throw "エラー: "+sheetName+"のシートが作れませんでした";
    }
    else {
      // 中身が無い場合は新規作成
      if(sheet.getLastRow() == 0) {
        // ヘッダの書き出し
        var rowNo = 1;
        var cols = this.scheme.columns.map(function(c) { return c.name; });
        sheet.getRange("A"+rowNo+":"+String.fromCharCode(65 + cols.length - 1)+rowNo).setValues([cols]);
      }
    }

    this._sheets[sheetname] = sheet;

    return sheet;
  };

  GSTimesheets.prototype._getKeys = function(sheet) {
    if (this.keys) {
      return this.keys;
    }

    this.keys = _.reduce(sheet.getRange(getRowRange(1)).getValues()[0], function(memo, v, i) {
      memo[v] = i;
      return memo;
    }, {});
    return this.keys;
  };

  GSTimesheets.prototype.get = function(username, date) {
    var t = DateUtils.toDate(date).getTime();
    var vs = this.getAll();
    var row = _.find(vs, function(v) {
      return DateUtils.toDate(v.date).getTime() == t && v.user == username;
    });

    if(!row) {
      return {};
    }

    return row;
  };

  GSTimesheets.prototype.set = function(username, date, params) {
    var user = this.findUserAndCreate(username);
    var row = this.get(username, date);
    _.extend(row, _.pick(params, 'signIn', 'signOut', 'note'));

    var sheet = this.sheet;
    if(row.rowNo) {
      var rowNo = row.rowNo;
    } else {
      var rowNo = sheet.getLastRow() + 1;
    }
    if(rowNo <= offset) rowNo = offset;

    var data = [username, DateUtils.toDate(date), row.signIn, row.signOut, row.note].map(function(v) {
      return v == null ? '' : v;
    });
    sheet.getRange(getRowRange(rowNo)).setValues([data]);

    // clear cache
    this._all = undefined;
  };

  GSTimesheets.prototype.getAll = function() {
    if(this._all) return this._all;

    var lastRow = this.sheet.getLastRow();
    if(lastRow <= offset) lastRow = offset;
    var keys = this._getKeys(this.sheet);

    var vs = this.sheet.getRange(getRange(offset, lastRow)).getValues();
    this._all = _.chain(vs)
      .map(function(v, k) {
        return {
          rowNo: k + offset,
          user: v[keys['名前']],
          date: v[keys['日付']],
          signIn: v[keys['出勤']],
          signOut: v[keys['退勤']],
          note: v[keys['ノート']],
        };
      })
      .filter(function(v) { return v.name !== '' && v.date !== ''; })
      .value();

    return this._all;
  };

  GSTimesheets.prototype.findUserAndCreate = function(username) {
    var user = this.users.get(username);
    if(user.name) {
      return user;
    }

    this.users.set(username);
    return this.users.get(username);
  };

  GSTimesheets.prototype.getUsers = function() {
    return this.users.getUsernames();
  };

  GSTimesheets.prototype.getByDate = function(date) {
    var t = date.getTime();
    return _.filter(this.getAll(), function(v) {
      return v.date.getTime() == t;
    });
  };

  // 休みの曜日を数字で返す
  GSTimesheets.prototype.getDayOff = function(username) {
    var user = this.users.get(username);
    return DateUtils.parseWday(user.dayoff);
  };

  function getRowRange(rowNo) {
    return getRange(rowNo, rowNo);
  }

  function getRange(rowA, rowB) {
    return columnRange[0] + rowA + ':' + columnRange[1] + rowB;
  }

  return GSTimesheets;
};

if(typeof exports !== 'undefined') {
  exports.GSTimesheets = loadGSTimesheets();
}
