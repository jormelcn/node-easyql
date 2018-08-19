const easyql = require('./dist/index');

const db = new easyql.Easyql({
  host : 'localhost',
  db : 'node_test',
  user : 'test',
  password : '123456'
});

const sql = db.connect({
  reportError : error => {
    console.error('Ocurrió un error:', error);
  }
});

const q1 = sql.select('*').from('table1').where('id = 1');
const q2 = sql.select(['col1', 'col2']).from('table1').where(['id = 1', 'col3 = 5']);
const q3 = sql.insertInto('table2').values({id : 2, name : 'myname'});
const q4 = sql.insertInto('table2').values([{id : 2, name : 'myname'}, {id : 3, name : 'othername'}]);
const q5 = sql.update('table3').set({name : 'othername'}).where('id = :id');
const q6 = sql.deleteFrom('table4').where('id > 4');



sql.transaction(() => {
  console.log('TRANSACTION START READY');
  /*q5.parse({id: 5}).commit(info => {
    console.log('Q5 Info:', info);
  });*/
  sql.commit(() => {
    console.log('TRANSACTION COMMIT READY');
  });
});

const sql2 = db.connect(null);

sql2.select('*').from('a').commit((info, rows) => {
  console.log('Num Rows: ' + info.numRows);
  console.log('COLUMNAS:', rows);
});


setTimeout(() => {
  console.log('Q1: ' + q1.toString());
  console.log('Q2: ' + q2.toString());
  console.log('Q3: ' + q3.toString());
  console.log('Q4: ' + q4.toString());
  console.log('Q5: ' + q5.toString());
  console.log('Q5: ' + q6.toString());
}, 1000);


