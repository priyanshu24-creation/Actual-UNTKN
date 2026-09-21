import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import products from "../data/products";


function Search() {

  const [searchParams, setSearchParams] =
    useSearchParams();

  const initialQuery =
    searchParams.get("q") || "";

  const [query, setQuery] =
    useState(initialQuery);


  const results = useMemo(() => {

    const search = query
      .trim()
      .toLowerCase();

    if (!search) {
      return products;
    }


    return products.filter((product) => {

      return (
        product.name
          .toLowerCase()
          .includes(search) ||

        product.category
          .toLowerCase()
          .includes(search) ||

        product.collection
          .toLowerCase()
          .includes(search)
      );

    });

  }, [query]);


  const handleSearch = (event) => {

    event.preventDefault();

    const trimmedQuery =
      query.trim();

    if (trimmedQuery) {

      setSearchParams({
        q: trimmedQuery,
      });

    } else {

      setSearchParams({});

    }

  };


  return (
    <div className="search-page">

      <section className="search-header">

        <p className="eyebrow">
          FIND YOUR STYLE
        </p>

        <h1>
          SEARCH
        </h1>


        <form
          className="search-form"
          onSubmit={handleSearch}
        >

          <input
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="SEARCH PRODUCTS..."
            autoFocus
          />

          <button type="submit">
            SEARCH →
          </button>

        </form>

      </section>


      <section className="search-results">

        <div className="search-results-header">

          <p>
            {results.length} PRODUCT
            {results.length !== 1
              ? "S"
              : ""}
          </p>

          {query && (
            <span>
              RESULTS FOR "{query.toUpperCase()}"
            </span>
          )}

        </div>


        {results.length > 0 ? (

          <div className="search-grid">

            {results.map((product) => (

              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="search-card"
              >

                <div className="search-image">

                  <img
                    src={product.image}
                    alt={product.name}
                  />

                </div>

                <div className="search-card-info">

                  <div>

                    <h2>
                      {product.name}
                    </h2>

                    <p>
                      {product.category}
                    </p>

                  </div>

                  <strong>
                    ₹{product.price}
                  </strong>

                </div>

              </Link>

            ))}

          </div>

        ) : (

          <div className="no-search-results">

            <h2>
              NO PRODUCTS FOUND.
            </h2>

            <p>
              Try another product name,
              category or collection.
            </p>

            <Link to="/shop">
              VIEW ALL PRODUCTS →
            </Link>

          </div>

        )}

      </section>

    </div>
  );
}


export default Search;