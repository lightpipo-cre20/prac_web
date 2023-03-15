//필요한 외부 모듈 가져오기 
/*
    express : 서버와 웹브라우저 통신에 필요한 모듈
    mysql : 데이터베이스(mysql) 와 서버와의 통신에 필요한 모듈
    path: 경로 설정을 위한 모듈
    serve-static : srv.js 가 루트 경로(/)로 설정할때 필요한 모듈
*/
const { exec } = require('child_process')

const express = require('express')
const mysql = require('mysql') // 안깔려있으면 설치 : npm install mysql
const path = require('path') 
const static = require('serve-static')

/*
    데이터가 노출되지 않도록
    데이터 저장되어 있는 파일을 따로 만들어서 
    불러오는 형식으로 사용
*/
const dbconfig = require('./config/dbconfig.json')

//Database connection pool
//pool :  모아놓고 사용하는 곳

const pool = mysql.createPool({
    connectionLimit: 10,
    host: dbconfig.host,
    user: dbconfig.user,
    password: dbconfig.password,
    database: dbconfig.database,
    debug: false
})
//const pool = mysql.createPool(dbconfig)

//웹 서버 만들기
const app = express()
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use('/public', static(path.join(__dirname, 'public')))


app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/public/index.html')
})

var user = 0;
var paramID;
var paramPassword;


//wb들어온 요청 처리 -- /process/login이 수신
app.post('/process/login', (req,res)=>{

    console.log('/process/login 호출됨 '+req)
    paramID = req.body.id;
    paramPassword = req.body.password;
    
    console.log('로그인 요청 '+paramID+' '+paramPassword)

    pool.getConnection((err, conn)=>{
        if(err){
            //err가 널이 아닌 경우
            conn.release();
            console.log('Mysql getConnection error, aborted');
            res.writeHead('200', {'Content-Type':'text/html; charset=utf8'})
            res.write('<h1>DB서버 연결 실패</h1>')
            res.end();
            return;
        }else{
            console.log('데이터베이스 연결 끈 얻었음...ㅎㅎ');
        }

        const exec = conn.query('select `id`, `name` from users where `id`=? and `password`=md5(?)',
            [paramID,paramPassword],
            (err, rows)=>{
                conn.release();
                console.log('실행된 SQL query : '+exec.sql)

                if(err){
                    console.log('SQL 실행시 오류 발생')
                    console.dir(err); //에러 세부정보 찍기
                    res.writeHead('200', {'Content-Type':'text/html; charset=utf8'})
                    res.write('<h1>SQL query실행 실패</h1>')
                    res.end();
                    return;
                }

                if(rows.length > 0){
                    console.log('아이디 [%s], 패스워드가 일치하는 사용자 [%s] 찾음', paramID,rows[0].name);
                    //res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
                    user = rows[0].name;
                    
                    //res.write('<h1>로그인 성공</h1>');
                    res.sendFile(__dirname +'/public/index2.html')
                    return;
                }else{
                    console.log('아이디 [%s], 패스워드가 일치하지 않음', paramID);
                    res.writeHead('200', {'Content-Type':'text/html; charset=utf8'});
                    res.write('<h1>로그인 실패</h1>');
                    res.end();
                    return;
                }
            }
        )
    })
})

//wb들어온 요청 처리 -- /process/logout이 수신
app.get('/process/logout', (req,res)=>{

    console.log('/process/logout 호출됨 '+req)

    console.log('로그아웃 요청 '+paramID+' '+paramPassword)

    user = null;
    paramID = null;
    paramPassword = null;

    res.sendFile(__dirname + '/public/index.html')

})




//wb들어온 요청 처리 -- /process/adduser가 수신
app.post('/process/adduser', (req, res)=>{
    //console.log(req)
    console.log('/process/adduser 호출됨 ' +req)

     //wb가 보낸 데이터들 정보 뽑아내기 id, password등등)
    const paramID = req.body.id;
    const paramName = req.body.name;
    const paramAge = req.body.age;
    const paramPassword = req.body.password;
    //이렇게 정리한 것들을 db로 보내야함

    /*
    adduse.html 의 정보를 받아온 거 까지는 확인
    console.log(paramID)
    console.log(paramName)
    console.log(paramAge)
    */

    pool.getConnection((err, conn)=>{
        //놀고 있는 커넥션이 없으면 err
        //그게 아니면 db와 연결되어 있는 커넥션을 넘겨줌
        if(err){
            //err가 널이 아닌 경우
            conn.release();
            console.log('Mysql getConnection error, aborted');
            res.writeHead('200', {'Content-Type':'text/html; charset=utf8'})
            res.write('<h1>DB서버 연결 실패</h1>')
            res.end();
            return;
        }else{
            console.log('데이터베이스 연결 끈 얻었음...ㅎㅎ');
        }

        const exec = conn.query('insert into users (id, name, age, password) values (?,?,?,md5(?))',
                [paramID, paramName, paramAge, paramPassword],

                (err, result)=>{
                    conn.release();
                    console.log('실행된 SQL: '+exec.sql)

                    if(err){
                        console.log('SQL 실행시 오류 발생')
                        console.dir(err); //에러 세부정보 찍기
                        res.writeHead('200', {'Content-Type':'text/html; charset=utf8'})
                        res.write('<h1>SQL query실행 실패</h1>')
                        res.end();
                        return;
                    }

                    if(result){
                        console.dir(result); 
                        console.log('Intserted 성공')
                        
                        //res.writeHead('200', {'Content-Type':'text/html; charset=utf8'})
                        //res.write('<h2>사용자 추가 성공</h2>')
                        //res.end();
                        res.sendFile(__dirname + '/public/index.html')
                    }else{
                        console.log('Intserted 실패')
                        
                        res.writeHead('200', {'Content-Type':'text/html; charset=utf8'})
                        res.write('<h1>사용자 추가 실패</h1>')
                        res.end();
                    }
                }
        )
    })
});

//wb들어온 요청 처리 -- /process/remove이 수신
app.post('/process/remove', (req,res)=>{

    console.log('/process/remove 호출됨 '+req)
    checkpassword = req.body.password;
    
    console.log('탈퇴 요청 '+ paramPassword)
    
    if(checkpassword === paramPassword){
        pool.getConnection((err, conn)=>{
            if(err){
                //err가 널이 아닌 경우
                conn.release();
                console.log('Mysql getConnection error, aborted');
                res.writeHead('200', {'Content-Type':'text/html; charset=utf8'})
                res.write('<h1>DB서버 연결 실패</h1>')
                res.end();
                return;
            }else{
                console.log('데이터베이스 연결 끈 얻었음...ㅎㅎ');
            }
    
            const exec = conn.query('delete from users where `id`=? and `password`=md5(?)',
                [paramID,paramPassword],
                (err, rows)=>{
                    conn.release();
                    console.log('실행된 SQL query : '+exec.sql)
    
                    if(err){
                        console.log('SQL 실행시 오류 발생')
                        console.dir(err); //에러 세부정보 찍기
                        res.writeHead('200', {'Content-Type':'text/html; charset=utf8'})
                        res.write('<h1>SQL query실행 실패</h1>')
                        res.end();
                        return;
                    }else{
                        res.send('성공적으로 탈퇴되었습니다.')
                    }
                }
            )
        })
    }else{
        res.send('비밀번호가 일치하지 않습니다.')
    }

    
})



app.listen(3000, ()=>{
    console.log('Listening on port 3000')
})

