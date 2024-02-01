exports.filterKeyword = (req, res, next) => {
    let queries = req.query,
      filtration = {};

    Object.entries(queries).forEach(([key, value]) => { 
      if (value && key !== "page" && key !== "limit") {
        if (key == "username") {
          filtration["username"] = { $regex: value };
        }else if (key == "productName"){
            filtration["name"] = { $regex: value };   
        }else if (key == "subject"){
            filtration["subject"] = { $regex: value };
        } else{   
            filtration[key] = value;
        }
      }
    })

    res.locals.filter = filtration;
    next()
  };
  