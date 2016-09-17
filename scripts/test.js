loadTestSuite = function() {
  var sheetname = '__test';
  var userSheetname = '__test_user';

  function TestSuite() {
    initLibraries();

    var global_settings = new GASProperties();
    var spreadsheetId = global_settings.get('spreadsheet');
    this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);

    var res = true;
    res = res && this.testSpreadsheet(sheetname);
    res = res && this.testUsers(userSheetname);

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

  TestSuite.prototype.resetSpreadsheet = function(sheetname) {
    this.resetSheet(sheetname);
  };

  TestSuite.prototype.resetUser = function(sheetname) {
    this.resetSheet(sheetname);
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

  TestSuite.prototype.testSpreadsheet = function(sheetname) {
    this.resetSpreadsheet(sheetname);
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

    return res;
  };

  TestSuite.prototype.testUsers = function(sheetname) {
    this.resetUser(sheetname);
    users = new Users(this.spreadsheet, sheetname);

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
    var sheet = this.spreadsheet.getSheetByName(sheetname);
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

  return TestSuite;
};

function test() {
  var TestSuite = loadTestSuite();
  new TestSuite();
}
