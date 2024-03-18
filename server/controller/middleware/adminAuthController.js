const isLogin = async(req,res,next) => {

    try {
        if (!req.session.adminUserId) {
            res.redirect("/admin")
        }
        else{
            next()    
        }
        
    } catch (error) {
        console.log(error.message);
    }

}

const isLogout = async(req,res,next) => {

    try {
        
        if(req.session.adminUserId){
            res.redirect("/admin/dashboard")
        }else{
            next()
        }
        
    } catch (error) {
        console.log(error.message);
    }

}

module.exports = {
    isLogin,
    isLogout
}
