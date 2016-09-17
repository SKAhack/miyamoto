function TestSuite(miyamoto) {
  this.miyamoto = miyamoto;

  var global_settings = new GASProperties();
  var spreadsheetId = global_settings.get('spreadsheet');
  this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  var settings = new GSProperties(this.spreadsheet);
  this.storage = new GSTimesheets(this.spreadsheet, settings);

  var res = true;
  res = res && this.testSpreadsheet('__test');
  res = res && this.testUsers('__test_user');

  if(!res) {
    throw 'fail'
  }
}

TestSuite.prototype.resetSheet = function(sheetname) {
  var sheet = this.spreadsheet.getSheetByName(sheetname);
  if(sheet) {
    this.spreadsheet.deleteSheet(sheet);
  }

  this.sheet = this.spreadsheet.insertSheet(sheetname);
}

TestSuite.prototype.resetSpreadsheet = function(sheetname) {
  this.resetSheet(sheetname);
  this.setFixture();
};

TestSuite.prototype.resetUser = function(sheetname) {
  var sheet = this.spreadsheet.getSheetByName(sheetname);
  if(sheet) {
    this.spreadsheet.deleteSheet(sheet);
  }
};

TestSuite.prototype.setFixture = function() {
  var range = this.sheet.getRange('A1:E30');
  range.setValues([
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['名前', '日付', '出勤', '退勤', 'ノート'],
    ['', '', '', '', ''],
    ['foo', new Date(2016, 9, 10), new Date(2016, 9, 10), new Date(2016, 9, 10), 'foobar1'],
    ['bar', new Date(2016, 9, 10), new Date(2016, 9, 10), new Date(2016, 9, 10), 'foobar2'],
    ['foo', new Date(2016, 9, 11), new Date(2016, 9, 11), new Date(2016, 9, 11), 'foobar3'],
    ['foo', new Date(2016, 9, 12), new Date(2016, 9, 12), new Date(2016, 9, 12), 'foobar4'],
    ['foo', new Date(2016, 9, 13), new Date(2016, 9, 13), new Date(2016, 9, 13), 'foobar5'],

    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],

    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
  ]);
};

TestSuite.prototype.testSpreadsheet = function(sheetname) {
  this.resetSpreadsheet(sheetname);

  var res = true;
  var v = this.storage.get('foo', new Date(2016, 9, 11), sheetname);
  if (v.note !== 'foobar3') {
    res = false;
    Logger.log('testSpreadsheet: ' + v.note + ' !== foobar3');
  }

  v = this.storage.get('bar', new Date(2016, 9, 10), sheetname);
  if (v.note !== 'foobar2') {
    res = false;
    Logger.log('testSpreadsheet: ' + v.note + ' !== foobar2');
  }

  this.storage.set('baz', new Date(2016, 9, 10), {}, sheetname);
  v = this.storage.get('baz', new Date(2016, 9, 10), sheetname);
  if (v.user !== 'baz') {
    res = false;
    Logger.log('testSpreadsheet: ' + v.user + ' !== baz');
  }

  this.storage.set('baz', new Date(2016, 9, 10), {}, sheetname);
  var sheet = this.spreadsheet.getSheetByName(sheetname);
  v = _.filter(sheet.getRange('A6:A' + sheet.getLastRow()).getValues(), function(v) {
    return v[0] == 'baz'
  });
  if (v.length !== 1) {
    res = false;
    Logger.log('testSpreadsheet: ' + v.length + ' !== 1');
  }

  return res;
};

TestSuite.prototype.testUsers = function(sheetname) {
  this.resetUser(sheetname);
  users = new Users(this.spreadsheet, sheetname);

  var res = true;
  var v = users.get('foo');
  if (v.name !== undefined) {
    res = false;
    Logger.log('testUsers: ' + v.name + ' !== undefined');
  }

  users.set('foo');
  var v = users.get('foo');
  if (v.name !== 'foo') {
    res = false;
    Logger.log('testUsers: ' + v.name + ' !== foo');
  }

  users.set('foo');
  var sheet = this.spreadsheet.getSheetByName(sheetname);
  v = _.filter(sheet.getRange('A3:A' + sheet.getLastRow()).getValues(), function(v) {
    return v[0] == 'foo'
  });
  if (v.length !== 1) {
    res = false;
    Logger.log('testUsers: ' + v.length + ' !== 1');
  }

  return res;
};

function test() {
  var miyamoto = init();
  new TestSuite(miyamoto);
}
