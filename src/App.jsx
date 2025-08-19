import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";

// Utility to format numbers
const formatNumber = (n) => new Intl.NumberFormat().format(n);

// Hook for fetching countries
function useCountries() {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,flags,population,region,capital,currencies,languages,cca3"
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json.sort((a, b) => a.name.common.localeCompare(b.name.common)));
      } catch (e) {
        setError("Unable to load countries.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, error, loading };
}

// Controls (search, filter, sort)
function Controls({ query, setQuery, region, setRegion, sort, setSort, regions, count }) {
  return (
    <section className="sticky top-0 z-10 backdrop-blur bg-gray-100/80 dark:bg-gray-800/80 border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-3 md:items-end">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search country..."
          className="flex-1 rounded-xl border px-4 py-2 outline-none 
                     focus:ring-2 focus:ring-indigo-500 
                     bg-white dark:bg-gray-700 
                     text-gray-900 dark:text-gray-100"
        />
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="rounded-xl border px-4 py-2 
                     bg-white dark:bg-gray-700 
                     text-gray-900 dark:text-gray-100"
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border px-4 py-2 
                     bg-white dark:bg-gray-700 
                     text-gray-900 dark:text-gray-100"
        >
          <option value="name">Name A–Z</option>
          <option value="pop-desc">Population High → Low</option>
          <option value="pop-asc">Population Low → High</option>
        </select>
        <span className="ml-auto text-sm text-gray-700 dark:text-gray-300">{count} results</span>
      </div>
    </section>
  );
}

// Country Card
function CountryCard({ c }) {
  return (
    <li className="rounded-xl overflow-hidden border hover:shadow-md bg-white dark:bg-gray-800">
      <Link to={`/country/${c.cca3}`} className="block">
        <img src={c.flags.svg} alt={`${c.name.common} flag`} className="w-full h-40 object-cover" />
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{c.name.common}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">Population: {formatNumber(c.population)}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">Region: {c.region}</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">Capital: {c.capital?.[0] || "—"}</p>
        </div>
      </Link>
    </li>
  );
}

// List Page
function ListPage() {
  const { data, error, loading } = useCountries();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [sort, setSort] = useState("name");

  const regions = useMemo(() => [...new Set(data.map((c) => c.region))].filter(Boolean).sort(), [data]);

  const filtered = useMemo(() => {
    let arr = [...data];
    if (query) arr = arr.filter((c) => c.name.common.toLowerCase().includes(query.toLowerCase()));
    if (region) arr = arr.filter((c) => c.region === region);
    if (sort === "pop-desc") arr.sort((a, b) => b.population - a.population);
    else if (sort === "pop-asc") arr.sort((a, b) => a.population - b.population);
    else arr.sort((a, b) => a.name.common.localeCompare(b.name.common));
    return arr;
  }, [data, query, region, sort]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Updated Header color */}
      <header className="border-b p-4 text-left text-2xl font-bold 
                         bg-gray-200 dark:bg-gray-800 
                         text-gray-800 dark:text-gray-100">
       COUNTRIES EXPLORER
      </header>

      <Controls query={query} setQuery={setQuery} region={region} setRegion={setRegion} sort={sort} setSort={setSort} regions={regions} count={filtered.length} />

      {error && <p className="p-4 text-red-500">{error}</p>}
      {loading ? (
        <p className="p-4">Loading...</p>
      ) : (
        <ul className="grid gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((c) => (
            <CountryCard key={c.cca3} c={c} />
          ))}
        </ul>
      )}
    </main>
  );
}

// Detail Page
function DetailPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [country, setCountry] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`https://restcountries.com/v3.1/alpha/${code}`);
      const json = await res.json();
      setCountry(Array.isArray(json) ? json[0] : json);
    }
    load();
  }, [code]);

  if (!country) return <p className="p-4">Loading...</p>;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-4 py-2 border rounded 
                     bg-gray-200 hover:bg-gray-300 
                     dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
        >
          ← Back
        </button>
        <img src={country.flags.svg} alt={`${country.name.common} flag`} className="w-full h-60 object-cover rounded-lg" />
        <h2 className="text-2xl font-bold mt-4">{country.name.common}</h2>
        <p><b>Official:</b> {country.name.official}</p>
        <p><b>Capital:</b> {country.capital?.join(", ") || "—"}</p>
        <p><b>Population:</b> {formatNumber(country.population)}</p>
        <p><b>Region:</b> {country.region}</p>
        <p><b>Currencies:</b> {country.currencies ? Object.values(country.currencies).map((c) => c.name).join(", ") : "—"}</p>
        <p><b>Languages:</b> {country.languages ? Object.values(country.languages).join(", ") : "—"}</p>
      </div>
    </main>
  );
}

// Not Found Page
function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-center text-gray-900 dark:text-gray-100">
      <h2 className="text-2xl font-bold">Page Not Found</h2>
      <Link to="/" className="text-indigo-500 underline">Go Home</Link>
    </main>
  );
}

// Theme Toggle
function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="fixed top-2 right-2 px-3 py-1.5 border rounded 
                 bg-indigo-500 text-white hover:bg-indigo-600 shadow"
    >
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

// App
export default function App() {
  return (
    <BrowserRouter>
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/country/:code" element={<DetailPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
