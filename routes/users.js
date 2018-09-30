var express = require('express');
var router = express.Router();
//引入mysql模块
const mysql = require('mysql');
//连接数据库
const connection = mysql.createConnection({
   host:'localhost',
   user:'root',
   password:'root',
   database:'admin'
});
//调用连接方法
connection.connect(()=>{
  console.log('数据库连接成功。。。')
});
// 接收登陆请求
router.post("/login",(req,res)=>{
   let{username,password}=req.body;
   var sqlstr = `select * from users where  username='${username}' and password = '${password}'`;
   connection.query(sqlstr,(err,data)=>{
     if(err){
       throw err;
     }else{
       if(data.length){
         //登陆成功，设置cookie
         res.cookie("username",data[0].username);
         res.cookie("password",data[0].password);
         res.cookie("groups",data[0].groups);
         res.cookie("id",data[0].id);
         res.send({"errcode":"1","msg":"登陆成功"})
       }else{
         res.send({"errcode":"0","msg":"登陆失败"})
     }
    }
   })
});
// 接收用户是否已经登陆的请求
router.get('/checkIsLogin',(req,res)=>{
  //获取浏览器获取的cookie
  var username = req.cookies.username;
  if(username){
    res.send("");
  }else{
    res.send("alert('请登录'),location.href='/login.html'");
    
  }
});
//退出登陆请求
router.get("/logout",(req,res)=>{
   // 清除cookie
  res.clearCookie('username');
  res.clearCookie('password');
  res.clearCookie('groups');
  res.clearCookie('id');
  // 弹出对应提示 跳转到登录页面
  res.send('<script>alert("请登陆"); location.href="http://localhost:777/login.html";</script>')

});
/* 接收前端添加用户账号的请求 */
router.post('/useradd', (req, res)=> {
  //接收前端用户账号的数据
  let {username,password,group}=req.body;
  //构造sql语句
  const sqlstr ='insert into users(username,password,groups) value(?,?,?)';
  //接收 到的数据参数
  const sqlPrarams = [username,password,group];
  //执行sql语句
  connection.query(sqlstr,sqlPrarams,(err,data)=>{
    if(err){
      throw err;
    }else{
      //检查是否插入成功
      //如果受影响的行数>0 成功
      if(data.affectedRows>0){
        res.send({"errcode":1,'msg':"添加成功"})
      }else{
        //插入失败  响应一个失败的对象回去
        res.send({'errcode':0,'msg':'添加失败'})
      }
    }
  })
});

// 接收显示所有用户账号的请求
router.get('/userList',(req,res)=>{
  //接收参数
  let{pageSize,currentPage}=req.query;
console.log(req.query);
  //构造SQL
  let sqlstr='select * from users';
  //执行sql
  connection.query(sqlstr,(err,data)=>{
    if(err){
      throw err;
    }else{
      //计算数据总条数
      let totalcount = data.length;
      //计算跳过多少条
      let n = (currentPage-1)*pageSize;
      console.log(n);
      //构造sql语句 按条件查询对应页码的数据
      sqlstr += ` order by ctime desc limit ${n},${pageSize}`;
       //执行sql语句
       connection.query(sqlstr,(err,data)=>{
         if(err){
           throw err;
         }else{
           //把数据的总条数和 当前页码的数据一起发送给前端
           res.send({"totalcount":totalcount,"pageData":data});
         }
       })
      
    }
  })
});

//接收单条删除的请求
router.get('/userDeleteOne',(req,res)=>{
    let {id}=req.query;
    
    //根据id删除数据库中的数据
    const sqlstr = `delete from users where id=${id}` ;
    //执行sql语句
    connection.query(sqlstr,(err,data)=>{
      if(err){
        throw err;
      }else{
        if(data.affectedRows>0){
          res.send({"errcode":1,"msg":"删除成功"});
        }else{
          res.send({"errcode":0,"msg":"删除失败！"});
        }
      }
    })
    
});
//接收编辑用户数据的请求 回显
router.get("/useredit",(req,res)=>{
  let {id} =req.query;
  var sqlstr = `select * from users where id = ${id}`;
  connection.query(sqlstr,(err,data)=>{
    if(err){
      throw err;
    }else{
      res.send(data);
    }
  })


});
//接收编辑用户新数据的请求 
router.post('/usereditsave',(req,res)=>{
  //接收新数据和原来的id
    let{username,password,group,id} = req.body;

    //修改数据库里的这条数据
    var sqlstr = `update users set username='${username}',password = '${password}',groups = '${group}' where id='${id}'`;
    connection.query(sqlstr,(err,data)=>{
        if(err){
          throw err;
        }else{
          if(data.affectedRows>0){
            res.send({"errcode":"1","msg":"修改成功"});
          }else{
            res.send({"errcode":"0","msg":"修改失败"})
          }
        }

    })
});

//接收批量删除的请求
router.post("/batchsdel",(req,res)=>{
  //接收前端选中的需要批量删除的数据的id
  let idArr = req.body['idArr[]'];
  //构造sql 根据id们 把选择的数据删除
  const sqlstr = `delete from users where id in(${idArr})`;
  //执行sql语句
  connection.query(sqlstr,(err,data)=>{
    if(err){
      throw err;
    }else{
      if(data.affectedRows>0){
        res.send({"errcode":"1","msg":"批量删除成功"});
      }else{
        res.send({"errcode":"0","msg":"批量删除失败"})
      }
    }
  })

});
//接收旧密码
router.get('/oldpassword',(req,res)=>{
    //接收旧密码
    let{oldpassword}=req.query;
    //从cookie中的取出当前登陆用户的id
    const id = req.cookies.id;
    var sqlstr = `select * from users where id = ${id}`;
    //执行
    connection.query(sqlstr,(err,data)=>{
      if(err){
        throw err;
      }else{
        if(data[0].password === oldpassword){
          res.send({"errcode":"1","msg":"原密码正确"})
        }else{
          res.send({"errcode":"0","msg":"原密码错误"})
      }
    }
  })


});
//接收修改密码的请求
router.post('/psd',(req,res)=>{
  let {newpassword} = req.body;
 
  // 获取当前登录用户的id
  let id = req.cookies.id;
  // 构造sql 执行修改
  const sqlstr = `update users set password='${newpassword}' where id='${id}'`;
  connection.query(sqlstr,(err,data)=>{
    if(err){
      throw err;
    }else{
      清除cookie
      res.clearCookie('username');
      res.clearCookie('id');
      res.clearCookie('groups');
      res.send({"errcode":"1","msg":"密码修改成功"})
    }
  })
});


module.exports = router;
