import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import heroImage from "../src/assets/banner.png";
import { api, formatMoney } from "./lib/api";

type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  stock: number;
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  imageUrl: string | null;
  status: ProductStatus;
  categoryId: string | null;
  category: Category | null;
};
type User = { id: string; name: string; email: string; role: "ADMIN" | "USER" };
type AdminUser = User & { createdAt: string };
type Cart = {
  items: Array<{
    id: string;
    productId: string;
    name: string;
    priceCents: number;
    quantity: number;
    lineTotalCents: number;
    imageUrl: string | null;
  }>;
  subtotalCents: number;
};
type ShippingQuote = {
  provider: string;
  service: string;
  priceCents: number;
  etaDays: number;
};
type Order = {
  id: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  items: Array<{ id: string; productName: string; quantity: number }>;
  payment: { status: string } | null;
};
type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const storedTheme = window.localStorage.getItem("ecommerce-theme");
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function Header({
  user,
  onLogout,
  categories,
  categoryId,
  search,
  onCategoryChange,
  onSearchChange,
  theme,
  onThemeToggle,
  cartCount,
}: {
  user: User | null;
  onLogout: () => void;
  categories: Category[];
  categoryId: string;
  search: string;
  onCategoryChange: (id: string) => void;
  onSearchChange: (value: string) => void;
  theme: Theme;
  onThemeToggle: () => void;
  cartCount: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <Link to="/" className="brand" onClick={closeMenu}>
        Minha Loja
      </Link>
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        aria-controls="main-navigation"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span />
        <span />
        <span />
      </button>
      <nav id="main-navigation" className={menuOpen ? "is-open" : ""}>
        <Link to="/" onClick={closeMenu}>
          Produtos
        </Link>
        <details className="category-menu">
          <summary>Categorias</summary>
          <div className="category-menu-items">
            <Link
              to="/"
              aria-current={!categoryId ? "page" : undefined}
              onClick={() => {
                onCategoryChange("");
                closeMenu();
              }}
            >
              Todas as categorias
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                to="/"
                aria-current={categoryId === category.id ? "page" : undefined}
                onClick={() => {
                  onCategoryChange(category.id);
                  closeMenu();
                }}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </details>
        <form
          className="nav-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            closeMenu();
          }}
        >
          <label className="sr-only" htmlFor="product-search">
            Pesquisar produtos pelo nome
          </label>
          <input
            id="product-search"
            type="search"
            placeholder="Buscar produto..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </form>
        {user && (
          <Link
            to="/carrinho"
            className="cart-link"
            aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? "item" : "itens"}`}
            onClick={closeMenu}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M3 3h2l2.4 12.1a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 8H6" />
              <circle cx="10" cy="21" r="1" />
              <circle cx="18" cy="21" r="1" />
            </svg>
            Carrinho
            <span className="cart-count" aria-hidden="true">
              {cartCount}
            </span>
          </Link>
        )}
        {user?.role === "ADMIN" && (
          <Link to="/admin" onClick={closeMenu}>
            Admin
          </Link>
        )}
        {user ? (
          <>
            <span className="user-label">Olá, {user.name}</span>
            <button
              className="button secondary small"
              onClick={() => {
                closeMenu();
                onLogout();
              }}
            >
              Sair
            </button>
          </>
        ) : (
          <Link to="/login" onClick={closeMenu}>
            Entrar
          </Link>
        )}
        <button
          type="button"
          className="theme-toggle icon-only"
          onClick={onThemeToggle}
          aria-label={`Ativar modo ${theme === "dark" ? "claro" : "escuro"}`}
        >
          {theme === "dark" ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
            </svg>
          )}
        </button>
      </nav>
    </header>
  );
}

function Catalog({
  onError,
  onCartItemAdded,
  categoryId,
  search,
}: {
  onError: (message: string) => void;
  onCartItemAdded: () => void;
  categoryId: string;
  search: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const query = new URLSearchParams({ limit: "50" });
    if (categoryId) query.set("categoryId", categoryId);
    if (search.trim()) query.set("search", search.trim());
    const timeout = window.setTimeout(() => {
      api<{ products: Product[] }>(`/api/products?${query.toString()}`)
        .then((data) => {
          if (active) setProducts(data.products);
        })
        .catch((e) => {
          if (active)
            onError(
              e instanceof Error
                ? e.message
                : "Não foi possível carregar os produtos.",
            );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [categoryId, search, onError]);
  async function add(productId: string) {
    try {
      await api("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      onCartItemAdded();
      alert("Produto adicionado ao carrinho.");
    } catch (e) {
      onError(
        e instanceof Error
          ? e.message
          : "Faça login para adicionar ao carrinho.",
      );
    }
  }
  const isHome = !categoryId && !search.trim();
  return (
    <>
      {isHome && (
        <section className="hero" aria-labelledby="home-hero-title">
          <div className="hero-copy">
            <p className="eyebrow">LOJA ONLINE</p>
            <h1 id="home-hero-title">Seu próximo favorito está aqui.</h1>
            <p className="hero-description">
              Descubra novidades e produtos escolhidos para fazer parte do seu
              dia.
            </p>
            <a className="button hero-cta" href="#catalogo">
              Explorar produtos
              <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="hero-visual">
            <div className="hero-glow" />
            <img
              className="hero-product-image"
              src={heroImage}
              alt="Coleção de ninjas de Konoha em miniaturas colecionáveis"
            />
          </div>
        </section>
      )}
      {loading ? (
        <p>Carregando produtos...</p>
      ) : (
        <>
          <h2 className="catalog-heading" id="catalogo">
            {search.trim()
              ? `Resultados para "${search.trim()}"`
              : categoryId
                ? "Produtos da categoria"
                : "Todos os produtos"}
          </h2>
          <section className="grid">
            {products.length === 0 ? (
              <p>
                {search.trim() || categoryId
                  ? "Nenhum produto encontrado para esses filtros."
                  : "Nenhum produto ativo cadastrado. Entre como administrador e cadastre pelo painel."}
              </p>
            ) : (
              products.map((product) => (
                <article className="card" key={product.id}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} />
                  ) : (
                    <div className="placeholder">Produto</div>
                  )}
                  <div className="card-body">
                    <h2>{product.name}</h2>
                    <p>{product.description}</p>
                    <strong>{formatMoney(product.priceCents)}</strong>
                    <p className="muted">{product.stock} em estoque</p>
                    <button
                      className="button"
                      disabled={product.stock < 1}
                      onClick={() => void add(product.id)}
                    >
                      Adicionar ao carrinho
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </>
  );
}

function Login({
  onLogin,
  onError,
}: {
  onLogin: (user: User) => void;
  onError: (message: string) => void;
}) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (isRegister)
        await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
      const data = await api<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      onLogin(data.user);
      navigate("/");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Não foi possível entrar.");
    }
  }
  return (
    <section className="form-panel">
      <h1>{isRegister ? "Criar conta" : "Entrar"}</h1>
      <form onSubmit={submit}>
        {isRegister && (
          <label>
            Nome
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={3}
            />
          </label>
        )}
        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <button className="button" type="submit">
          {isRegister ? "Cadastrar e entrar" : "Entrar"}
        </button>
      </form>
      <button
        className="link-button"
        onClick={() => setIsRegister(!isRegister)}
      >
        {isRegister ? "Já tenho conta" : "Não tenho conta — cadastrar"}
      </button>
    </section>
  );
}

function CartPage({
  onError,
  onCartChange,
}: {
  onError: (message: string) => void;
  onCartChange: (cart: Cart) => void;
}) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [postalCode, setPostalCode] = useState("");
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[] | null>(null);
  const [shippingDemo, setShippingDemo] = useState(false);
  const [quotingShipping, setQuotingShipping] = useState(false);
  async function load() {
    try {
      const data = await api<{ cart: Cart }>("/api/cart");
      setCart(data.cart);
      onCartChange(data.cart);
      setShippingQuotes(null);
    } catch (e) {
      onError(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar o carrinho.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  async function remove(id: string) {
    try {
      await api(`/api/cart/items/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Erro ao remover.");
    }
  }
  async function quoteShipping(event: React.FormEvent) {
    event.preventDefault();
    if (!cart) return;
    setQuotingShipping(true);
    setShippingQuotes(null);
    setShippingDemo(false);
    try {
      const data = await api<{ quotes: ShippingQuote[]; demo: boolean }>("/api/shipping/quote", {
        method: "POST",
        body: JSON.stringify({
          postalCode,
          items: cart.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        }),
      });
      setShippingQuotes(data.quotes);
      setShippingDemo(data.demo);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Não foi possível calcular o frete.");
      setShippingQuotes(null);
    } finally {
      setQuotingShipping(false);
    }
  }
  if (loading) return <p>Carregando carrinho...</p>;
  if (!cart || cart.items.length === 0)
    return (
      <section className="form-panel">
        <h1>Seu carrinho está vazio</h1>
        <Link to="/" className="button">
          Ver produtos
        </Link>
      </section>
    );
  return (
    <section>
      <h1>Meu carrinho</h1>
      <div className="cart-list">
        {cart.items.map((item) => (
          <article className="cart-item" key={item.id}>
            <div className="cart-product">
              {item.imageUrl ? (
                <img
                  className="cart-product-image"
                  src={item.imageUrl}
                  alt={item.name}
                />
              ) : (
                <div className="cart-product-image cart-product-placeholder">
                  Produto
                </div>
              )}
              <div>
                <strong>{item.name}</strong>
                <p>
                  {item.quantity} × {formatMoney(item.priceCents)}
                </p>
              </div>
            </div>
            <strong>{formatMoney(item.lineTotalCents)}</strong>
            <button
              className="link-button danger"
              onClick={() => void remove(item.id)}
            >
              Remover
            </button>
          </article>
        ))}
      </div>
      <div className="total">
        <span>Subtotal</span>
        <strong>{formatMoney(cart.subtotalCents)}</strong>
      </div>
      <section className="form-panel">
        <h2>Calcular frete</h2>
        <form onSubmit={quoteShipping}>
          <label>
            CEP de entrega
            <input
              inputMode="numeric"
              autoComplete="postal-code"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              placeholder="00000-000"
              required
              pattern="\d{5}-?\d{3}"
              title="Informe um CEP válido."
            />
          </label>
          <button className="button" type="submit" disabled={quotingShipping}>
            {quotingShipping ? "Calculando..." : "Consultar opções"}
          </button>
        </form>
        {shippingDemo && (
          <p className="muted">Valores demonstrativos; não representam preço real de frete.</p>
        )}
        {shippingQuotes && shippingQuotes.length === 0 && (
          <p className="muted">Nenhuma opção de frete disponível para este CEP.</p>
        )}
        {shippingQuotes && shippingQuotes.length > 0 && (
          <div className="cart-list">
            {shippingQuotes.map((quote, index) => (
              <article className="cart-item" key={`${quote.provider}-${quote.service}-${index}`}>
                <div>
                  <strong>{quote.provider} — {quote.service}</strong>
                  <p className="muted">Prazo: {quote.etaDays} dias úteis</p>
                </div>
                <strong>{formatMoney(quote.priceCents)}</strong>
              </article>
            ))}
          </div>
        )}
      </section>
      <p className="muted">
        Para finalizar a compra, cadastre um endereço e crie o pedido pela API.
        O checkout visual completo será uma próxima etapa.
      </p>
    </section>
  );
}

const orderStatuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function AdminPage({
  onError,
  currentUserId,
}: {
  onError: (message: string) => void;
  currentUserId: string;
}) {
  const [section, setSection] = useState<
    "products" | "categories" | "orders" | "users"
  >("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [weightGrams, setWeightGrams] = useState("");
  const [lengthMeters, setLengthMeters] = useState("");
  const [widthMeters, setWidthMeters] = useState("");
  const [heightMeters, setHeightMeters] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [productStatus, setProductStatus] = useState<ProductStatus>("DRAFT");
  const [categoryIdEditing, setCategoryIdEditing] = useState<string | null>(
    null,
  );
  const [categoryName, setCategoryName] = useState("");
  const [userIdEditing, setUserIdEditing] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<User["role"]>("USER");

  async function loadProducts() {
    try {
      const data = await api<{ products: Product[] }>("/api/products/admin");
      setProducts(data.products);
    } catch (e) {
      onError(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar os produtos.",
      );
    }
  }
  async function loadCategories() {
    try {
      const data = await api<{ categories: Category[] }>("/api/categories");
      setCategories(data.categories);
    } catch (e) {
      onError(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar as categorias.",
      );
    }
  }
  async function loadOrders() {
    try {
      const data = await api<{ orders: Order[] }>("/api/orders");
      setOrders(data.orders);
    } catch (e) {
      onError(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar os pedidos.",
      );
    }
  }
  async function loadUsers() {
    try {
      const data = await api<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(data.users);
    } catch (e) {
      onError(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar os usuários.",
      );
    }
  }
  useEffect(() => {
    void loadProducts();
    void loadCategories();
    void loadOrders();
    void loadUsers();
  }, []);

  function resetProductForm() {
    setProductId(null);
    setProductName("");
    setDescription("");
    setPrice("");
    setStock("0");
    setWeightGrams("");
    setLengthMeters("");
    setWidthMeters("");
    setHeightMeters("");
    setCategoryId("");
    setImageUrl("");
    setProductStatus("DRAFT");
  }
  function editProduct(product: Product) {
    setProductId(product.id);
    setProductName(product.name);
    setDescription(product.description);
    setPrice((product.priceCents / 100).toFixed(2));
    setStock(String(product.stock));
    setWeightGrams(product.weightGrams === null ? "" : String(product.weightGrams));
    setLengthMeters(product.lengthCm === null ? "" : (product.lengthCm / 100).toFixed(2));
    setWidthMeters(product.widthCm === null ? "" : (product.widthCm / 100).toFixed(2));
    setHeightMeters(product.heightCm === null ? "" : (product.heightCm / 100).toFixed(2));
    setCategoryId(product.categoryId || "");
    setImageUrl(product.imageUrl || "");
    setProductStatus(product.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function saveProduct(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      name: productName,
      description,
      priceCents: Math.round(Number(price.replace(",", ".")) * 100),
      stock: Number(stock),
      weightGrams: Number(weightGrams),
      lengthCm: Math.round(Number(lengthMeters.replace(",", ".")) * 100),
      widthCm: Math.round(Number(widthMeters.replace(",", ".")) * 100),
      heightCm: Math.round(Number(heightMeters.replace(",", ".")) * 100),
      categoryId: categoryId || null,
      imageUrl: imageUrl || null,
      status: productStatus,
    };
    try {
      await api(productId ? `/api/products/${productId}` : "/api/products", {
        method: productId ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      resetProductForm();
      await loadProducts();
    } catch (e) {
      onError(
        e instanceof Error ? e.message : "Não foi possível salvar o produto.",
      );
    }
  }
  async function archiveProduct(product: Product) {
    if (!window.confirm(`Arquivar "${product.name}"?`)) return;
    try {
      await api(`/api/products/${product.id}`, { method: "DELETE" });
      await loadProducts();
    } catch (e) {
      onError(
        e instanceof Error ? e.message : "Não foi possível arquivar o produto.",
      );
    }
  }
  async function saveCategory(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api(
        categoryIdEditing
          ? `/api/categories/${categoryIdEditing}`
          : "/api/categories",
        {
          method: categoryIdEditing ? "PATCH" : "POST",
          body: JSON.stringify({ name: categoryName }),
        },
      );
      setCategoryIdEditing(null);
      setCategoryName("");
      await loadCategories();
    } catch (e) {
      onError(
        e instanceof Error ? e.message : "Não foi possível salvar a categoria.",
      );
    }
  }
  async function deleteCategory(category: Category) {
    if (!window.confirm(`Remover a categoria "${category.name}"?`)) return;
    try {
      await api(`/api/categories/${category.id}`, { method: "DELETE" });
      await loadCategories();
      await loadProducts();
    } catch (e) {
      onError(
        e instanceof Error
          ? e.message
          : "Não foi possível remover a categoria.",
      );
    }
  }
  async function updateOrder(id: string, status: OrderStatus) {
    try {
      await api(`/api/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadOrders();
    } catch (e) {
      onError(
        e instanceof Error ? e.message : "Não foi possível atualizar o pedido.",
      );
    }
  }
  function resetUserForm() {
    setUserIdEditing(null);
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    setUserRole("USER");
  }
  function editUser(user: AdminUser) {
    setUserIdEditing(user.id);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserPassword("");
    setUserRole(user.role);
  }
  async function saveUser(event: React.FormEvent) {
    event.preventDefault();
    const payload: {
      name: string;
      email: string;
      role: User["role"];
      password?: string;
    } = {
      name: userName,
      email: userEmail,
      role: userRole,
    };
    if (!userIdEditing || userPassword) payload.password = userPassword;
    try {
      await api(
        userIdEditing
          ? `/api/admin/users/${userIdEditing}`
          : "/api/admin/users",
        {
          method: userIdEditing ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      resetUserForm();
      await loadUsers();
    } catch (e) {
      onError(
        e instanceof Error ? e.message : "Não foi possível salvar o usuário.",
      );
    }
  }
  async function removeUser(user: AdminUser) {
    if (!window.confirm(`Excluir o usuário "${user.name}"?`)) return;
    try {
      await api(`/api/admin/users/${user.id}`, { method: "DELETE" });
      await loadUsers();
    } catch (e) {
      onError(
        e instanceof Error ? e.message : "Não foi possível excluir o usuário.",
      );
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">ADMINISTRAÇÃO</p>
          <h1>Painel administrativo</h1>
        </div>
      </div>
      <div
        className="admin-tabs"
        role="tablist"
        aria-label="Seções administrativas"
      >
        <button
          className={section === "products" ? "active" : ""}
          onClick={() => setSection("products")}
        >
          Produtos
        </button>
        <button
          className={section === "categories" ? "active" : ""}
          onClick={() => setSection("categories")}
        >
          Categorias
        </button>
        <button
          className={section === "orders" ? "active" : ""}
          onClick={() => setSection("orders")}
        >
          Pedidos
        </button>
        <button
          className={section === "users" ? "active" : ""}
          onClick={() => setSection("users")}
        >
          Usuários
        </button>
      </div>
      {section === "products" && (
        <div className="admin-content">
          <form className="admin-form" onSubmit={saveProduct}>
            <h2>{productId ? "Editar produto" : "Novo produto"}</h2>
            <label>
              Nome
              <input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                minLength={2}
              />
            </label>
            <label>
              Descrição
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </label>
            <div className="admin-form-row">
              <label>
                Preço (R$)
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                />
              </label>
              <label>
                Estoque
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  min="0"
                  step="1"
                />
              </label>
            </div>
            <label>
              Peso (gramas)
              <input
                type="number"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                required
                min="1"
                step="1"
                placeholder="Ex.: 250"
              />
            </label>
            <div className="admin-form-row">
              <label>
                Comprimento (m)
                <input
                  type="number"
                  value={lengthMeters}
                  onChange={(e) => setLengthMeters(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="Ex.: 0,16"
                />
              </label>
              <label>
                Largura (m)
                <input
                  type="number"
                  value={widthMeters}
                  onChange={(e) => setWidthMeters(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="Ex.: 0,10"
                />
              </label>
            </div>
            <label>
              Altura (m)
              <input
                type="number"
                value={heightMeters}
                onChange={(e) => setHeightMeters(e.target.value)}
                required
                min="0.01"
                step="0.01"
                placeholder="Ex.: 0,5"
              />
            </label>
            <label>
              Categoria
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Sem categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              URL da imagem
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </label>
            <label>
              Status
              <select
                value={productStatus}
                onChange={(e) =>
                  setProductStatus(e.target.value as ProductStatus)
                }
              >
                <option value="DRAFT">Rascunho</option>
                <option value="ACTIVE">Ativo</option>
                <option value="ARCHIVED">Arquivado</option>
              </select>
            </label>
            <div className="admin-actions">
              <button className="button" type="submit">
                {productId ? "Salvar alterações" : "Criar produto"}
              </button>
              {productId && (
                <button
                  className="button secondary"
                  type="button"
                  onClick={resetProductForm}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
          <div className="admin-list">
            <h2>Produtos cadastrados ({products.length})</h2>
            {products.length === 0 ? (
              <p className="muted">Nenhum produto cadastrado.</p>
            ) : (
              products.map((product) => (
                <article className="admin-row" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <p>
                      {formatMoney(product.priceCents)} · Estoque:{" "}
                      {product.stock} ·{" "}
                      {product.category?.name || "Sem categoria"}
                    </p>
                    <span
                      className={`status-badge ${product.status.toLowerCase()}`}
                    >
                      {product.status}
                    </span>
                  </div>
                  <div className="admin-actions">
                    <button
                      className="button secondary small"
                      onClick={() => editProduct(product)}
                    >
                      Editar
                    </button>
                    {product.status !== "ARCHIVED" && (
                      <button
                        className="button danger-button small"
                        onClick={() => void archiveProduct(product)}
                      >
                        Arquivar
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}
      {section === "categories" && (
        <div className="admin-content">
          <form className="admin-form" onSubmit={saveCategory}>
            <h2>{categoryIdEditing ? "Editar categoria" : "Nova categoria"}</h2>
            <label>
              Nome
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                minLength={2}
              />
            </label>
            <div className="admin-actions">
              <button className="button" type="submit">
                {categoryIdEditing ? "Salvar alterações" : "Criar categoria"}
              </button>
              {categoryIdEditing && (
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    setCategoryIdEditing(null);
                    setCategoryName("");
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
          <div className="admin-list">
            <h2>Categorias cadastradas ({categories.length})</h2>
            {categories.length === 0 ? (
              <p className="muted">Nenhuma categoria cadastrada.</p>
            ) : (
              categories.map((category) => (
                <article className="admin-row" key={category.id}>
                  <div>
                    <strong>{category.name}</strong>
                    <p className="muted">{category.slug}</p>
                  </div>
                  <div className="admin-actions">
                    <button
                      className="button secondary small"
                      onClick={() => {
                        setCategoryIdEditing(category.id);
                        setCategoryName(category.name);
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="button danger-button small"
                      onClick={() => void deleteCategory(category)}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}
      {section === "orders" && (
        <div className="admin-list order-list">
          <h2>Pedidos ({orders.length})</h2>
          {orders.length === 0 ? (
            <p className="muted">Nenhum pedido cadastrado.</p>
          ) : (
            orders.map((order) => (
              <AdminOrder key={order.id} order={order} onUpdate={updateOrder} />
            ))
          )}
        </div>
      )}
      {section === "users" && (
        <div className="admin-content">
          <form className="admin-form" onSubmit={saveUser}>
            <h2>{userIdEditing ? "Editar usuário" : "Novo usuário"}</h2>
            <label>
              Nome
              <input
                value={userName}
                onChange={(event) => setUserName(event.target.value)}
                required
                minLength={3}
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={userEmail}
                onChange={(event) => setUserEmail(event.target.value)}
                required
              />
            </label>
            <label>
              {userIdEditing ? "Nova senha (opcional)" : "Senha"}
              <input
                type="password"
                value={userPassword}
                onChange={(event) => setUserPassword(event.target.value)}
                required={!userIdEditing}
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <label>
              Perfil
              <select
                value={userRole}
                disabled={userIdEditing === currentUserId}
                onChange={(event) =>
                  setUserRole(event.target.value as User["role"])
                }
              >
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
            <p className="muted">
              Senhas devem ter no mínimo 8 caracteres. Contas com pedidos não
              podem ser excluídas para preservar o histórico.
            </p>
            <div className="admin-actions">
              <button className="button" type="submit">
                {userIdEditing ? "Salvar alterações" : "Criar usuário"}
              </button>
              {userIdEditing && (
                <button
                  className="button secondary"
                  type="button"
                  onClick={resetUserForm}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
          <div className="admin-list">
            <h2>Usuários cadastrados ({users.length})</h2>
            {users.length === 0 ? (
              <p className="muted">Nenhum usuário cadastrado.</p>
            ) : (
              users.map((user) => (
                <article className="admin-row" key={user.id}>
                  <div>
                    <strong>
                      {user.name}
                      {user.id === currentUserId ? " (você)" : ""}
                    </strong>
                    <p>{user.email}</p>
                    <span
                      className={`status-badge ${user.role === "ADMIN" ? "active" : ""}`}
                    >
                      {user.role === "ADMIN" ? "Administrador" : "Usuário"}
                    </span>
                    <p className="muted">
                      Cadastro:{" "}
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="admin-actions">
                    <button
                      className="button secondary small"
                      onClick={() => editUser(user)}
                    >
                      Editar
                    </button>
                    <button
                      className="button danger-button small"
                      disabled={user.id === currentUserId}
                      title={
                        user.id === currentUserId
                          ? "Não é possível excluir sua própria conta."
                          : undefined
                      }
                      onClick={() => void removeUser(user)}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function AdminOrder({
  order,
  onUpdate,
}: {
  order: Order;
  onUpdate: (id: string, status: OrderStatus) => Promise<void>;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  return (
    <article className="admin-row order-row">
      <div>
        <strong>Pedido #{order.id.slice(0, 8)}</strong>
        <p>
          {new Date(order.createdAt).toLocaleString("pt-BR")} ·{" "}
          {order.items.length} produto(s) · {formatMoney(order.totalCents)}
        </p>
        <p className="muted">
          Pagamento: {order.payment?.status || "PENDENTE"}
        </p>
      </div>
      <div className="order-status">
        <select
          aria-label="Status do pedido"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
        >
          {orderStatuses.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button
          className="button small"
          disabled={status === order.status}
          onClick={() => void onUpdate(order.id, status)}
        >
          Atualizar
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  useEffect(() => {
    api<{ user: User }>("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);
  useEffect(() => {
    let active = true;
    if (!user) {
      setCartCount(0);
      return () => {
        active = false;
      };
    }
    api<{ cart: Cart }>("/api/cart")
      .then((data) => {
        if (active)
          setCartCount(
            data.cart.items.reduce((total, item) => total + item.quantity, 0),
          );
      })
      .catch((e) => {
        if (active)
          setNotice(
            e instanceof Error
              ? e.message
              : "Não foi possível carregar o carrinho.",
          );
      });
    return () => {
      active = false;
    };
  }, [user]);
  useEffect(() => {
    api<{ categories: Category[] }>("/api/categories")
      .then((data) => setCategories(data.categories))
      .catch((e) =>
        setNotice(
          e instanceof Error
            ? e.message
            : "Não foi possível carregar as categorias.",
        ),
      );
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("ecommerce-theme", theme);
  }, [theme]);
  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }
  return (
    <div className="app-shell">
      <Header
        user={user}
        onLogout={() => void logout()}
        categories={categories}
        categoryId={categoryId}
        search={search}
        onCategoryChange={setCategoryId}
        onSearchChange={setSearch}
        theme={theme}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
        cartCount={cartCount}
      />
      {notice && (
        <div className="notice" role="alert">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
      <main className="container">
        <Routes>
          <Route
            path="/"
            element={
              <Catalog
                onError={setNotice}
                onCartItemAdded={() => setCartCount((count) => count + 1)}
                categoryId={categoryId}
                search={search}
              />
            }
          />
          <Route
            path="/login"
            element={<Login onLogin={setUser} onError={setNotice} />}
          />
          <Route
            path="/carrinho"
            element={
              <CartPage
                onError={setNotice}
                onCartChange={(cart) =>
                  setCartCount(
                    cart.items.reduce(
                      (total, item) => total + item.quantity,
                      0,
                    ),
                  )
                }
              />
            }
          />
          <Route
            path="/admin"
            element={
              authLoading ? (
                <p>Verificando acesso...</p>
              ) : user?.role === "ADMIN" ? (
                <AdminPage onError={setNotice} currentUserId={user.id} />
              ) : (
                <section className="form-panel">
                  <h1>Acesso restrito</h1>
                  <p>Esta área é exclusiva para administradores.</p>
                  <Link to="/">Voltar à loja</Link>
                </section>
              )
            }
          />
          <Route
            path="*"
            element={
              <section className="form-panel">
                <h1>Página não encontrada</h1>
                <Link to="/">Voltar à loja</Link>
              </section>
            }
          />
        </Routes>
      </main>
      <footer>Minha Loja · E-commerce MVP</footer>
    </div>
  );
}
