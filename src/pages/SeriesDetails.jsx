import "./SeriesDetails.css";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Link,
    useParams,
} from "react-router-dom";

import {
    ArrowLeft,
    Play,
    Eye,
    Tv,
    Layers3,
    Clock3,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

import {
    getSeriesById,
    addSeriesView,
    addEpisodeView,
} from "../services/series";

/* =========================================
   COMPONENT
========================================= */

export default function SeriesDetails() {

    const { id } =
        useParams();

    const videoRef =
        useRef(null);

    const [series, setSeries] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [
        selectedSeason,
        setSelectedSeason,
    ] = useState(0);

    const [
        selectedEpisode,
        setSelectedEpisode,
    ] = useState(null);

    const [
        expandedSeasons,
        setExpandedSeasons,
    ] = useState({});

    /* =========================================
       LOAD
    ========================================= */

    useEffect(() => {

        async function load() {

            try {

                setLoading(true);

                const data =
                    await getSeriesById(
                        id
                    );

                setSeries(data);

                if (
                    data?.seasons?.length
                ) {

                    setExpandedSeasons({
                        0: true,
                    });

                }

                await addSeriesView(id);

            } catch (error) {

                console.error(error);

            } finally {

                setLoading(false);

            }

        }

        load();

    }, [id]);

    /* =========================================
       TOTAL EPISODES
    ========================================= */

    const totalEpisodes =
        useMemo(() => {

            return (
                series?.seasons?.reduce(
                    (
                        acc,
                        season
                    ) =>
                        acc +
                        (
                            season
                                .episodes
                                ?.length || 0
                        ),
                    0
                ) || 0
            );

        }, [series]);

    /* =========================================
       CURRENT VIDEO
    ========================================= */

    const currentVideo =
        selectedEpisode ||
        series?.seasons?.[0]
            ?.episodes?.[0];

    /* =========================================
       STREAM URL
    ========================================= */

    const streamUrl =
        useMemo(() => {

            if (
                !currentVideo?.videoUrl
            ) {
                return "";
            }

            return `${import.meta.env.VITE_API_URL}/api/stream?page=${encodeURIComponent(
                currentVideo.videoUrl
            )}`;

        }, [currentVideo]);

    /* =========================================
       FORCE VIDEO RELOAD
    ========================================= */

    useEffect(() => {

        if (
            !videoRef.current ||
            !currentVideo
        ) {
            return;
        }

        const video =
            videoRef.current;

        video.load();

        const playPromise =
            video.play();

        if (
            playPromise !==
            undefined
        ) {

            playPromise
                .catch(() => { });

        }

    }, [currentVideo]);

    /* =========================================
       TOGGLE SEASON
    ========================================= */

    function toggleSeason(index) {

        setExpandedSeasons(
            (prev) => ({
                ...prev,
                [index]:
                    !prev[index],
            })
        );

    }

    /* =========================================
       PLAY EPISODE
    ========================================= */

    async function handlePlayEpisode(
        seasonIndex,
        episode
    ) {

        try {

            setSelectedSeason(
                seasonIndex
            );

            setSelectedEpisode(
                episode
            );

            await addEpisodeView(
                series._id,
                seasonIndex + 1,
                episode.episodeNumber
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });

        } catch (error) {

            console.error(error);

        }

    }

    /* =========================================
       LOADING
    ========================================= */

    if (loading) {

        return (
            <div className="series-details-loading">
                <div className="series-loader" />
            </div>
        );

    }

    /* =========================================
       NOT FOUND
    ========================================= */

    if (!series) {

        return (
            <div className="series-details-error">
                Série não encontrada.
            </div>
        );

    }

    /* =========================================
       RENDER
    ========================================= */

    return (
        <div className="series-details-page">

            {/* =====================================
                BACKDROP
            ===================================== */}

            <div className="series-details-backdrop">

                <img
                    src={
                        series.backdrop ||
                        series.poster
                    }
                    alt={series.title}
                />

            </div>

            <div className="series-details-overlay" />

            {/* =====================================
                TOPBAR
            ===================================== */}

            <div className="series-details-topbar">

                <Link
                    to="/series"
                    className="series-back-button"
                >

                    <ArrowLeft size={18} />

                    Voltar

                </Link>

            </div>

            {/* =====================================
                HERO
            ===================================== */}

            <section className="series-hero">

                <div className="series-hero-poster">

                    <img
                        src={
                            series.poster
                        }
                        alt={series.title}
                    />

                </div>

                <div className="series-hero-content">

                    <h1>
                        {series.title}
                    </h1>

                    <div className="series-meta">

                        <span>
                            <Tv size={16} />
                            {
                                series.year
                            }
                        </span>

                        <span>
                            <Layers3 size={16} />
                            {
                                series
                                    .seasons
                                    ?.length
                            }{" "}
                            temporadas
                        </span>

                        <span>
                            <Play size={16} />
                            {
                                totalEpisodes
                            }{" "}
                            episódios
                        </span>

                        <span>
                            <Eye size={16} />
                            {(
                                series.views ||
                                0
                            ).toLocaleString()}
                        </span>

                    </div>

                    <p className="series-overview">
                        {
                            series.overview
                        }
                    </p>

                    <div className="series-genres">

                        {series.genres?.map(
                            (
                                genre,
                                index
                            ) => (
                                <span
                                    key={index}
                                >
                                    {genre}
                                </span>
                            )
                        )}

                    </div>

                    {currentVideo && (
                        <button
                            className="watch-series-button"
                            onClick={() =>
                                handlePlayEpisode(
                                    0,
                                    currentVideo
                                )
                            }
                        >

                            <Play size={18} />

                            Assistir Agora

                        </button>
                    )}

                </div>

            </section>

            {/* =====================================
                PLAYER
            ===================================== */}

            {currentVideo && (
                <section className="series-player-section">

                    <div className="series-player-header">

                        <div>

                            <span>
                                Temporada{" "}
                                {selectedSeason + 1}
                            </span>

                            <h2>

                                Episódio{" "}
                                {
                                    currentVideo.episodeNumber
                                }
                                :{" "}
                                {
                                    currentVideo.title
                                }

                            </h2>

                        </div>

                        {currentVideo.duration && (
                            <div className="episode-duration">

                                <Clock3 size={16} />

                                {
                                    currentVideo.duration
                                }{" "}
                                min

                            </div>
                        )}

                    </div>

                    <div className="series-video-wrapper">

                        <video
                            ref={videoRef}
                            key={
                                currentVideo.videoUrl
                            }
                            controls
                            autoPlay
                            preload="metadata"
                            className="series-video"
                        >

                            <source
                                key={
                                    currentVideo.videoUrl
                                }
                                src={streamUrl}
                                type="video/mp4"
                            />

                            Seu navegador não suporta vídeo.

                        </video>

                    </div>

                    {currentVideo.overview && (
                        <p className="episode-overview">
                            {
                                currentVideo.overview
                            }
                        </p>
                    )}

                </section>
            )}

            {/* =====================================
                SEASONS
            ===================================== */}

            <section className="series-seasons-section">

                <div className="section-title">

                    <h2>
                        Temporadas
                    </h2>

                </div>

                <div className="season-list">

                    {series.seasons?.map(
                        (
                            season,
                            seasonIndex
                        ) => {

                            const isOpen =
                                expandedSeasons[
                                seasonIndex
                                ];

                            return (
                                <div
                                    key={
                                        seasonIndex
                                    }
                                    className="season-block"
                                >

                                    {/* =====================
                                        HEADER
                                    ===================== */}

                                    <button
                                        className="season-toggle"
                                        onClick={() =>
                                            toggleSeason(
                                                seasonIndex
                                            )
                                        }
                                    >

                                        <div>

                                            <h3>
                                                Temporada{" "}
                                                {
                                                    season.seasonNumber
                                                }
                                            </h3>

                                            <span>
                                                {
                                                    season
                                                        .episodes
                                                        ?.length
                                                }{" "}
                                                episódios
                                            </span>

                                        </div>

                                        {isOpen ? (
                                            <ChevronUp
                                                size={20}
                                            />
                                        ) : (
                                            <ChevronDown
                                                size={20}
                                            />
                                        )}

                                    </button>

                                    {/* =====================
                                        EPISODES
                                    ===================== */}

                                    {isOpen && (
                                        <div className="episode-list">

                                            {season.episodes?.map(
                                                (
                                                    episode,
                                                    episodeIndex
                                                ) => (
                                                    <button
                                                        key={
                                                            episodeIndex
                                                        }
                                                        className={`episode-item ${currentVideo?._id ===
                                                                episode._id
                                                                ? "active"
                                                                : ""
                                                            }`}
                                                        onClick={() =>
                                                            handlePlayEpisode(
                                                                seasonIndex,
                                                                episode
                                                            )
                                                        }
                                                    >

                                                        <div className="episode-thumb">

                                                            {episode.still ? (
                                                                <img
                                                                    src={
                                                                        episode.still
                                                                    }
                                                                    alt={
                                                                        episode.title
                                                                    }
                                                                />
                                                            ) : (
                                                                <div className="episode-no-thumb">

                                                                    <Play
                                                                        size={
                                                                            26
                                                                        }
                                                                    />

                                                                </div>
                                                            )}

                                                        </div>

                                                        <div className="episode-info">

                                                            <div className="episode-title-row">

                                                                <h4>

                                                                    E
                                                                    {
                                                                        episode.episodeNumber
                                                                    }
                                                                    {" · "}
                                                                    {
                                                                        episode.title
                                                                    }

                                                                </h4>

                                                                <span>

                                                                    <Eye
                                                                        size={
                                                                            14
                                                                        }
                                                                    />

                                                                    {(
                                                                        episode.views ||
                                                                        0
                                                                    ).toLocaleString()}

                                                                </span>

                                                            </div>

                                                            <p>
                                                                {
                                                                    episode.overview
                                                                }
                                                            </p>

                                                        </div>

                                                    </button>
                                                )
                                            )}

                                        </div>
                                    )}

                                </div>
                            );
                        }
                    )}

                </div>

            </section>

        </div>
    );
}