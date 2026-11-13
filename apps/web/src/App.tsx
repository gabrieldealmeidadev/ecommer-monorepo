import { useEffect, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { api, formatMoney } from './lib/api';

type Product = { id: string; name: string; slug: string; description: string; priceCents: number; stock: number; imageUrl: string | null };
type User = { id: string; name: string; email: string; role: 'ADMIN' | 'USER' };
type Cart = { items: Array<{ id: string; productId: string; name: string; priceCents: number; quantity: number; lineTotalCents: number; imageUrl: string | null }>; subtotalCents: number };

function Header({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  return <header className="header"><Link to="/" className="brand">Minha Loja</Link><nav><Link to="/">Produtos</Link>{user && <Link to="/carrinho">Carrinho</Link>}{user ? <><span className="user-label">Olá, {user.name}</span><button className="button secondary small" onClick={onLogout}>Sair</button></> : <Link to="/login">Entrar</Link>}</nav></header>;
}

function Catalog({ onError }: { onError: (message: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api<{ products: Product[] }>('/api/products').then(data => setProducts(data.products)).catch(e => onError(e.message)).finally(() => setLoading(false)); }, []);
  async function add(productId: string) {
    try { await api('/api/cart/items', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) }); alert('Produto adicionado ao carrinho.'); }
    catch (e) { onError(e instanceof Error ? e.message : 'Faça login para adicionar ao carrinho.'); }
  }
  if (loading) return <p>Carregando produtos...</p>;
  return <><section className="hero"><p className="eyebrow">LOJA ONLINE</p><h1>Produtos selecionados para você.</h1><p>Catálogo inicial do seu e-commerce.</p></section><section className="grid">{products.length === 0 ? <p>Nenhum produto ativo cadastrado. Entre como administrador e cadastre produtos pela API.</p> : products.map(product => <article className="card" key={product.id}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <div className="placeholder">Produto</div>}<div className="card-body"><h2>{product.name}</h2><p>{product.description}</p><strong>{formatMoney(product.priceCents)}</strong><p className="muted">{product.stock} em estoque</p><button className="button" disabled={product.stock < 1} onClick={() => void add(product.id)}>Adicionar ao carrinho</button></div></article>)}</section></>;
}

function Login({ onLogin, onError }: { onLogin: (user: User) => void; onError: (message: string) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (isRegister) await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      const data = await api<{ user: User }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      onLogin(data.user); navigate('/');
    } catch (e) { onError(e instanceof Error ? e.message : 'Não foi possível entrar.'); }
  }
  return <section className="form-panel"><h1>{isRegister ? 'Criar conta' : 'Entrar'}</h1><form onSubmit={submit}>{isRegister && <label>Nome<input value={name} onChange={e => setName(e.target.value)} required minLength={3} /></label>}<label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} /></label><button className="button" type="submit">{isRegister ? 'Cadastrar e entrar' : 'Entrar'}</button></form><button className="link-button" onClick={() => setIsRegister(!isRegister)}>{isRegister ? 'Já tenho conta' : 'Não tenho conta — cadastrar'}</button></section>;
}

function CartPage({ onError }: { onError: (message: string) => void }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  async function load() { try { const data = await api<{ cart: Cart }>('/api/cart'); setCart(data.cart); } catch (e) { onError(e instanceof Error ? e.message : 'Não foi possível carregar o carrinho.'); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function remove(id: string) { try { await api(`/api/cart/items/${id}`, { method: 'DELETE' }); await load(); } catch (e) { onError(e instanceof Error ? e.message : 'Erro ao remover.'); } }
  if (loading) return <p>Carregando carrinho...</p>;
  if (!cart || cart.items.length === 0) return <section className="form-panel"><h1>Seu carrinho está vazio</h1><Link to="/" className="button">Ver produtos</Link></section>;
  return <section><h1>Meu carrinho</h1><div className="cart-list">{cart.items.map(item => <article className="cart-item" key={item.id}><div><strong>{item.name}</strong><p>{item.quantity} × {formatMoney(item.priceCents)}</p></div><strong>{formatMoney(item.lineTotalCents)}</strong><button className="link-button danger" onClick={() => void remove(item.id)}>Remover</button></article>)}</div><div className="total"><span>Subtotal</span><strong>{formatMoney(cart.subtotalCents)}</strong></div><p className="muted">Para finalizar a compra, cadastre um endereço e crie o pedido pela API. O checkout visual completo será uma próxima etapa.</p></section>;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => { api<{ user: User }>('/api/auth/me').then(data => setUser(data.user)).catch(() => setUser(null)); }, []);
  async function logout() { try { await api('/api/auth/logout', { method: 'POST' }); } finally { setUser(null); } }
  return <div className="app-shell"><Header user={user} onLogout={() => void logout()} />{notice && <div className="notice" role="alert">{notice}<button onClick={() => setNotice('')}>×</button></div>}<main className="container"><Routes><Route path="/" element={<Catalog onError={setNotice} />} /><Route path="/login" element={<Login onLogin={setUser} onError={setNotice} />} /><Route path="/carrinho" element={<CartPage onError={setNotice} />} /><Route path="*" element={<section className="form-panel"><h1>Página não encontrada</h1><Link to="/">Voltar à loja</Link></section>} /></Routes></main><footer>Minha Loja · E-commerce MVP</footer></div>;
}
