import {useNavigate} from 'react-router';
import {BagContents,useCart} from '../components/CartProvider';
export default function BagPage(){const navigate=useNavigate();const {cart}=useCart();return <section className="cart-page"><p className="eyebrow">Equator / Shopping bag</p><h1>Your bag {cart?.totalQuantity?`(${cart.totalQuantity})`:''}</h1><BagContents close={()=>{}} continueShopping={()=>navigate('/collections/new-arrivals')}/></section>;}
