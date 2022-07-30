import { json } from 'body-parser';
import React, {useState, useEffect} from 'react'

function App() {
    const [addressInfo, setAddressInfo] = useState({walletInfo: {address: "fake-address", balance: 100}});

    useEffect(() => {
        fetch("http://localhost:3000/api/wallet-info")
        .then(res => res.json())
        .then(json => setAddressInfo(json))
        .catch(err => console.log(err.message))
    }, [])

    return (
        <div>
          Welcome to the blockchain...
          Address: {addressInfo.walletInfo.address} 
          balace: {addressInfo.walletInfo.balance} 
        </div>
    )
}

export default App
