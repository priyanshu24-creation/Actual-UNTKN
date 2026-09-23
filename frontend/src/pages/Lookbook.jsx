import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight } from "lucide-react";

import heroImage from "../assets/images/hero.jpg";
import api from "../services/api";
import "./Lookbook.css";

function Lookbook() {
    const [looks, setLooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const fetchLookbook = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/lookbook/active");
                const data = response?.data;

                if (!data?.success) {
                    throw new Error(data?.message || "Failed to load Lookbook");
                }

                const apiLooks = Array.isArray(data?.looks)
                    ? data.looks.filter(Boolean)
                    : [];

                const formattedLooks = apiLooks.map((look, index) => ({
                    id: look?.id ?? index + 1,
                    number: String(index + 1).padStart(2, "0"),
                    title: look?.title || "UNTKN LOOK",
                    subtitle: look?.subtitle || "",
                    description:
                        typeof look?.description === "string"
                            ? look.description
                            : "",
                    image: look?.image_url || look?.image || heroImage,
                    link: look?.link_url || "/shop",
                }));

                if (!cancelled) {
                    setLooks(formattedLooks);
                }
            } catch (err) {
                console.error("Lookbook fetch error:", err);
                if (!cancelled) {
                    setLooks([]);
                    setError(
                        err?.response?.data?.message ||
                        err?.message ||
                        "Unable to load the visual archive. Please check back shortly."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchLookbook();

        return () => {
            cancelled = true;
        };
    }, []);

    // Helper to safely render internal vs external links
    const renderActionLink = (url, className, children) => {
        const cleanUrl =
            typeof url === "string" && url.trim() !== "" ? url.trim() : "/shop";
        const isExternal =
            cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://");

        if (isExternal) {
            return (
                <a
                    href={cleanUrl}
                    className={className}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {children}
                </a>
            );
        }

        return (
            <Link to={cleanUrl} className={className}>
                {children}
            </Link>
        );
    };

    // -------------------------------------------------------------
    // LOADING SKELETON STATE
    // -------------------------------------------------------------
    if (loading) {
        return (
            <div className="untkn-lookbook-page">
                <div className="untkn-lookbook-container">
                    <header className="lb-masthead">
                        <div className="lb-masthead-meta">
                            <span>UNTKN {"//"} ARCHIVE</span>
                            <span>VOL. 01 / 2026</span>
                        </div>
                        <div className="lb-masthead-title-row">
                            <h1 className="lb-main-title">LOOKBOOK</h1>
                            <p className="lb-main-desc">
                                Loading latest visual editorial...
                            </p>
                        </div>
                    </header>

                    <div className="lb-hero-section">
                        <div className="lb-hero-card">
                            <div className="lb-skeleton-hero" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // ERROR STATE
    // -------------------------------------------------------------
    if (error) {
        return (
            <div className="untkn-lookbook-page">
                <div className="untkn-lookbook-container">
                    <header className="lb-masthead">
                        <div className="lb-masthead-meta">
                            <span>UNTKN {"//"} ARCHIVE</span>
                            <span>VOL. 01 / 2026</span>
                        </div>
                        <div className="lb-masthead-title-row">
                            <h1 className="lb-main-title">LOOKBOOK</h1>
                        </div>
                    </header>

                    <div className="lb-state-wrap">
                        <p className="lb-state-tag">SYSTEM NOTICE</p>
                        <h2 className="lb-state-title">THE ARCHIVE IS TEMPORARILY OFFLINE</h2>
                        <p className="lb-state-desc">{error}</p>
                        <Link to="/shop" className="lb-button-primary">
                            BROWSE COLLECTION <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------
    // EMPTY STATE
    // -------------------------------------------------------------
    if (looks.length === 0) {
        return (
            <div className="untkn-lookbook-page">
                <div className="untkn-lookbook-container">
                    <header className="lb-masthead">
                        <div className="lb-masthead-meta">
                            <span>UNTKN {"//"} ARCHIVE</span>
                            <span>VOL. 01 / 2026</span>
                        </div>
                        <div className="lb-masthead-title-row">
                            <h1 className="lb-main-title">LOOKBOOK</h1>
                        </div>
                    </header>

                    <div className="lb-state-wrap">
                        <p className="lb-state-tag">EDITORIAL ARCHIVE</p>
                        <h2 className="lb-state-title">NO CURRENT EDITORIAL</h2>
                        <p className="lb-state-desc">
                            The creative direction for the upcoming issue is currently underway. Stay tuned for the next drop.
                        </p>
                        <Link to="/shop" className="lb-button-primary">
                            EXPLORE SHOP <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const featuredLook = looks[0];
    const secondaryLooks = looks.slice(1);

    return (
        <div className="untkn-lookbook-page">
            <div className="untkn-lookbook-container">
                {/* Editorial Masthead */}
                <header className="lb-masthead">
                    <div className="lb-masthead-meta">
                        <span>UNTKN {"//"} VISUAL ARCHIVE</span>
                        <span>VOL. 01 • EDITION 2026</span>
                    </div>
                    <div className="lb-masthead-title-row">
                        <h1 className="lb-main-title">LOOKBOOK</h1>
                        <p className="lb-main-desc">
                            Curated silhouettes, textures and graphic studies from the UNTKN universe.
                        </p>
                    </div>
                </header>

                {/* Primary / Hero Feature Look */}
                {featuredLook && (
                    <section className="lb-hero-section">
                        <article className="lb-hero-card">
                            <div className="lb-hero-image-wrap">
                                <span className="lb-badge">LOOK {featuredLook.number} {"//"} ARCHIVE</span>
                                <img
                                    src={featuredLook.image}
                                    alt={featuredLook.title || "UNTKN Lookbook"}
                                    loading="eager"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = heroImage;
                                    }}
                                />
                            </div>

                            <div className="lb-hero-content">
                                <div className="lb-hero-text">
                                    <span className="lb-tag">FEATURED EDITORIAL</span>
                                    <h2 className="lb-hero-title">{featuredLook.title}</h2>
                                    {featuredLook.subtitle && (
                                        <p className="lb-hero-subtitle">{featuredLook.subtitle}</p>
                                    )}
                                    {featuredLook.description && (
                                        <p
                                            className="lb-hero-desc"
                                            style={{ whiteSpace: "pre-line" }}
                                        >
                                            {featuredLook.description}
                                        </p>
                                    )}
                                </div>

                                <div className="lb-hero-action">
                                    {renderActionLink(
                                        featuredLook.link,
                                        "lb-button-primary",
                                        <>
                                            SHOP THIS LOOK <ArrowUpRight size={14} />
                                        </>
                                    )}
                                </div>
                            </div>
                        </article>
                    </section>
                )}

                {/* Secondary Looks Grid (if more than 1 look) */}
                {secondaryLooks.length > 0 && (
                    <section className="lb-secondary-section">
                        <div className="lb-section-header">
                            <h3 className="lb-section-title">EDITORIAL SELECTIONS</h3>
                            <span className="lb-section-count">
                                {secondaryLooks.length} LOOK{secondaryLooks.length > 1 ? "S" : ""}
                            </span>
                        </div>

                        <div className="lb-cards-grid">
                            {secondaryLooks.map((look) => (
                                <article className="lb-card" key={look.id}>
                                    <div className="lb-card-image-wrap">
                                        <span className="lb-badge">LOOK {look.number}</span>
                                        <img
                                            src={look.image}
                                            alt={look.title || "UNTKN Look"}
                                            loading="lazy"
                                            onError={(e) => {
                                                e.currentTarget.onerror = null;
                                                e.currentTarget.src = heroImage;
                                            }}
                                        />
                                    </div>

                                    <div className="lb-card-content">
                                        <div>
                                            <h4 className="lb-card-title">{look.title}</h4>
                                            {look.subtitle && (
                                                <p className="lb-card-subtitle">{look.subtitle}</p>
                                            )}
                                        </div>

                                        {renderActionLink(
                                            look.link,
                                            "lb-card-link",
                                            <>
                                                SHOP LOOK <ArrowUpRight size={12} />
                                            </>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {/* Editorial Footer */}
                <section className="lb-footer-section">
                    <p className="lb-footer-eyebrow">THE NEXT CHAPTER</p>
                    <h2 className="lb-footer-title">
                        WEAR IT
                        <br />
                        YOUR WAY.
                    </h2>
                    <Link to="/shop" className="lb-footer-btn">
                        EXPLORE THE COLLECTION <ArrowRight size={14} />
                    </Link>
                </section>
            </div>
        </div>
    );
}

export default Lookbook;