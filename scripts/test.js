loadTestSuite = function() {
  var sheetname = '__test';
  var userSheetname = '__test_user';

  function TestSuite() {
    initLibraries();

    var global_settings = new GASProperties();
    var spreadsheetId = global_settings.get('spreadsheet');
    this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);

    DateUtils.now(new Date(2014,0,2,12,34,0));

    var res = true;
    // res = res && this.testUsers();
    res = res && this.testSpreadsheet();
    // res = res && this.testTimesheet();

    if(!res) {
      throw 'fail'
    }
  }

  TestSuite.prototype.resetSheet = function(sheetname) {
    var sheet = this.spreadsheet.getSheetByName(sheetname);
    if(sheet) {
      this.spreadsheet.deleteSheet(sheet);
    }
  }

  TestSuite.prototype.resetSpreadsheet = function() {
    this.resetSheet(sheetname);
  };

  TestSuite.prototype.resetUser = function() {
    this.resetSheet(userSheetname);
  };

  TestSuite.prototype.setFixture = function(storage) {

    var data = [
      ['foo', new Date(2016, 9, 10), new Date(2016, 9, 10), new Date(2016, 9, 10), 'foobar1'],
      ['bar', new Date(2016, 9, 10), new Date(2016, 9, 10), new Date(2016, 9, 10), 'foobar2'],
      ['foo', new Date(2016, 9, 11), new Date(2016, 9, 11), new Date(2016, 9, 11), 'foobar3'],
      ['foo', new Date(2016, 9, 12), new Date(2016, 9, 12), new Date(2016, 9, 12), 'foobar4'],
      ['foo', new Date(2016, 9, 13), new Date(2016, 9, 13), new Date(2016, 9, 13), 'foobar5'],
    ];
    _.each(data, function(v) {
      storage.set(v[0], v[1], { signIn: v[2], signOut: v[3], note: v[4] });
    });
  };

  TestSuite.prototype.testSpreadsheet = function() {
    this.resetSpreadsheet();
    this.resetUser();

    var settings = new GSProperties(this.spreadsheet);
    var users = new Users(this.spreadsheet, userSheetname);
    var storage = new GSTimesheets(this.spreadsheet, users, settings, sheetname);

    this.setFixture(storage);

    var res = true;
    var v = storage.get('foo', new Date(2016, 9, 11));
    if(v.note !== 'foobar3') {
      res = false;
      Logger.log('testSpreadsheet: ' + v.note + ' !== foobar3');
    }

    v = storage.get('bar', new Date(2016, 9, 10));
    if(v.note !== 'foobar2') {
      res = false;
      Logger.log('testSpreadsheet: ' + v.note + ' !== foobar2');
    }

    storage.set('baz', new Date(2016, 9, 10), {});
    v = storage.get('baz', new Date(2016, 9, 10));
    if(v.user !== 'baz') {
      res = false;
      Logger.log('testSpreadsheet: ' + v.user + ' !== baz');
    }

    storage.set('baz', new Date(2016, 9, 10), {});
    var sheet = this.spreadsheet.getSheetByName(sheetname);
    v = _.filter(sheet.getRange('A6:A' + sheet.getLastRow()).getValues(), function(v) {
      return v[0] == 'baz'
    });
    if(v.length !== 1) {
      res = false;
      Logger.log('testSpreadsheet: ' + v.length + ' !== 1');
    }

    v = storage.getUsers();
    if(!_.isEqual(v, ['foo', 'bar', 'baz'])) {
      res = false;
      Logger.log('testSpreadsheet: ' + v + ' !== ["foo", "bar", "baz"]');
    }

    v = storage.getByDate(new Date(2016, 9, 10));
    v = _.map(v, function(v) { return v.user; });
    if(!_.isEqual(v, ['foo', 'bar', 'baz'])) {
      res = false;
      Logger.log('testSpreadsheet: ' + v + ' !== ["foo", "bar", "baz"]');
    }

    v = storage.getDayOff('foo');
    if(!_.isEqual(v, [0, 6])) {
      res = false;
      Logger.log('testSpreadsheet: ' + v + ' !== [0, 6]');
    }

    return res;
  };

  TestSuite.prototype.testUsers = function(sheetname) {
    this.resetUser();
    users = new Users(this.spreadsheet, userSheetname);

    var res = true;
    var v = users.get('foo');
    if(v.name !== undefined) {
      res = false;
      Logger.log('testUsers: ' + v.name + ' !== undefined');
    }

    users.set('foo');
    var v = users.get('foo');
    if(v.name !== 'foo') {
      res = false;
      Logger.log('testUsers: ' + v.name + ' !== foo');
    }

    users.set('foo');
    var sheet = this.spreadsheet.getSheetByName(userSheetname);
    v = _.filter(sheet.getRange('A3:A' + sheet.getLastRow()).getValues(), function(v) {
      return v[0] == 'foo';
    });
    if(v.length !== 1) {
      res = false;
      Logger.log('testUsers: ' + v.length + ' !== 1');
    }

    users.set('bar');
    v = users.getUsernames();
    if(!_.isEqual(v, ['foo', 'bar'])) {
      res = false;
      Logger.log('testUsers: ' + v + ' !== ["foo", "bar"]');
    }

    return res;
  };

  TestSuite.prototype.testTimesheet = function() {
    var self = this;
    var settings = new GSProperties(this.spreadsheet);
    var users, storage, slack, timesheets;

    var res = true;

    var test = function(callback) {
      self.resetSpreadsheet();
      self.resetUser();

      users = new Users(self.spreadsheet, userSheetname);
      storage = new GSTimesheets(self.spreadsheet, users, settings, sheetname);
      slack = getSlackMock();
      timesheets = new Timesheets(storage, settings, slack);

      callback();
    };

    var msgTest = function(user, msg, expect_messages) {
      slack.clearMessages();
      timesheets.receiveMessage(user, msg);
      if (!_.isEqual(expect_messages, slack.messages)) {
        res = false;
        Logger.log('testTimesheet: '+user+":"+msg + ' ' + expect_messages +' != ' + slack.messages);
      }
    };

    test(function(){
      msgTest('test1', 'おはよう', [['出勤', 'test1', "2014/01/02 12:34"]]);
      msgTest('test1', 'おはよう 4:56', [['出勤更新', 'test1', "2014/01/02 04:56"]]);
      msgTest('test1', 'おはよう 4:56 2/3', [['出勤', 'test1', "2014/02/03 04:56"]]);
    });

    test(function(){
      msgTest('test1', 'おはよう', [['出勤', 'test1', "2014/01/02 12:34"]]);
      msgTest('test2', 'おはよう', [['出勤', 'test2', "2014/01/02 12:34"]]);
    });

    // 出勤時間の変更
    test(function() {
      msgTest('test1', 'おはよう', [['出勤', 'test1', "2014/01/02 12:34"]]);
      msgTest('test2', 'おはよう', [['出勤', 'test2', "2014/01/02 12:34"]]);
      msgTest('test1', 'おはよう', []);
      msgTest('test1', 'おはよう 4:56', [['出勤更新', 'test1', "2014/01/02 04:56"]]);
    });

    test(function() {
      msgTest('test3', 'おはよう 12:34 2/3', [['出勤', 'test3', "2014/02/03 12:34"]]);
      msgTest('test1', 'おはよう', [['出勤', 'test1', "2014/01/02 12:34"]]);
      msgTest('test1', '誰がいる？', [['出勤中', 'test1']]);
      msgTest('test2', 'おはよう', [['出勤', 'test2', "2014/01/02 12:34"]]);
      msgTest('test1', '誰がいる？', [['出勤中', 'test1, test2']]);
    });

    test(function() {
      msgTest('test1', '今日はお休み', [['休暇', 'test1', "2014/01/02"]]);
      msgTest('test2', '今日はお休み', [['休暇', 'test2', "2014/01/02"]]);
      msgTest('test1', '明日はお休み', [['休暇', 'test1', "2014/01/03"]]);
      msgTest('test1', '12/3はお休みでした', [['休暇', 'test1', "2013/12/03"]]);

      msgTest('test1', 'お休みしません', []);
      msgTest('test2', '今日はお休みしません', [['休暇取消', 'test2', "2014/01/02"]]);
      msgTest('test1', '明日はお休みしません', [['休暇取消', 'test1', "2014/01/03"]]);
    });

    test(function() {
      msgTest('test2', 'おはよう 12:34 2/3', [['出勤', 'test2', "2014/02/03 12:34"]]);
      msgTest('test1', 'おはよう', [['出勤', 'test1', "2014/01/02 12:34"]]);
      msgTest('test1', '__confirmSignIn__', [['出勤確認', ['test2']]]);
    });

    return res;
  };

  function getSlackMock() {
    return {
      messages: [],

      template: function(label) {
        message = [label];
        for (var i = 1; i < arguments.length; i++) {
          message.push(arguments[i]);
        }
        this.messages.push(message);
      },

      on: function() {},

      send: function(msg) {},

      // for testing
      clearMessages: function() {
        this.messages = [];
      }
    };
  }

  return TestSuite;
};

function test() {
  var TestSuite = loadTestSuite();
  new TestSuite();
}
