import React from 'react'
import {Link} from "react-router-dom"
import image from "../assets/logo.png"
// import { LinkContainer } from 'react-router-bootstrap'
import {Button} from "@material-ui/core"
// import {Button} from "react-bootstrap"

function HeaderComponent() {
  return (
    <div className="header">
        <div className="logoContainer">
            <Link to="/">
                <img src={image}/>
            </Link>
        </div>
        <div className="navBar">
            <Link to="/blocks">Blocks</Link>
            <Link to="/conduct-transaction">Conduct A Transaction</Link>
            <Link to="/transaction-pool">Transaction Pool</Link>
        </div>
        <div className="learnContainer">
            <Link to="/"> {/* update to /learn after implementing it */}
                <Button variant="contained" size="large" color="success">Learn</Button>
            </Link>
        </div>
    </div>
  )
}

export default HeaderComponent