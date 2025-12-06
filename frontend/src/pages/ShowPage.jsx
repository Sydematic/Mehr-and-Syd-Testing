import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ShowCard from "../components/ShowCard";
import Ratings from "../components/Ratings";
import { supabase } from "../client";
import { useUser } from "../context/UserContext";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const ShowPage = () => {
  const { id } = useParams();
  const { user } = useUser();
  const [details, setDetails] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  const [watched, setWatched] = useState(false);
  const [listed, setListed] = useState(false);

  // Trending shows
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState(null);
  const [trendingIndex, setTrendingIndex] = useState(0);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Show details
        const res = await fetch(
          `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&language=en-US`
        );
        if (!res.ok) throw new Error("Failed to fetch show details");
        const data = await res.json();
        setDetails(data);

        // Similar shows
        const simRes = await fetch(
          `https://api.themoviedb.org/3/tv/${id}/similar?api_key=${API_KEY}&language=en-US&page=1`
        );
        if (!simRes.ok) throw new Error("Failed to fetch similar shows");
        const simData = await simRes.json();
        setSimilar(simData.results || []);

        // User-specific info - use RPC instead of REST API
        if (user) {
          const { data: userData, error } = await supabase.rpc('get_user_show', {
            p_userid: user.id,
            p_showid: id
          });

          if (!error && userData && userData.length > 0) {
            setWatched(userData[0].watched);
            setListed(userData[0].listed);
          }
        }
      } catch (err) {
        console.error("Error fetching show details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, user]);

  // Fetch trending shows
  useEffect(() => {
    const fetchTrending = async () => {
      setTrendingLoading(true);
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/tv/week?api_key=${API_KEY}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.status_message || "Failed to fetch trending shows");
        setTrending(data.results || []);
      } catch (err) {
        console.error("Error fetching trending shows:", err);
        setTrendingError(err.message);
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const toggleWatched = async () => {
    if (!user) return alert("You must be logged in to mark shows as watched.");
    
    const newValue = !watched;
    setWatched(newValue);
    
    // Use RPC to bypass schema cache issue
    const { error } = await supabase.rpc('upsert_user_show', {
      p_userid: user.id,
      p_showid: id,
      p_title: details?.name || "Unknown Show",
      p_poster_path: details?.poster_path || null,
      p_watched: newValue,
      p_listed: listed
    });
    
    if (error) {
      console.error("Supabase update error:", JSON.stringify(error, null, 2));
      setWatched(!newValue); // Revert on error
      return;
    }

    // Count total watched shows and update profile
    const { data: countData } = await supabase.rpc('count_user_shows', {
      p_userid: user.id,
      p_watched: true
    });

    if (countData !== null) {
      await supabase
        .from("profiles")
        .update({ watched: countData })
        .eq("id", user.id);
    }
  };

  const toggleListed = async () => {
    if (!user) return alert("You must be logged in to list shows.");
    
    const newValue = !listed;
    setListed(newValue);
    
    // Use RPC to bypass schema cache issue
    const { error } = await supabase.rpc('upsert_user_show', {
      p_userid: user.id,
      p_showid: id,
      p_title: details?.name || "Unknown Show",
      p_poster_path: details?.poster_path || null,
      p_watched: watched,
      p_listed: newValue
    });
    
    if (error) {
      console.error("Supabase update error:", JSON.stringify(error, null, 2));
      setListed(!newValue); // Revert on error
      return;
    }

    // Count total listed shows and update profile
    const { data: countData } = await supabase.rpc('count_user_shows', {
      p_userid: user.id,
      p_listed: true
    });

    if (countData !== null) {
      await supabase
        .from("profiles")
        .update({ want_to_watch: countData })
        .eq("id", user.id);
    }
  };

  if (loading) return <p className="text-white p-6">Loading...</p>;
  if (!details) return <p className="text-white p-6">Show not found</p>;

  return (
    <div className="min-h-screen text-white my-32 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Hero Poster */}
        <div>
          {details.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
              alt={details.name}
              className="rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full h-96 bg-accent flex items-center justify-center rounded-lg">
              No Image
            </div>
          )}
        </div>

        {/* Show Details */}
        <div className="md:col-span-2">
          <h1 className="text-4xl font-bold mb-2">{details.name}</h1>

          {/* TMDB Rating */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-highlight text-xl">⭐</span>
            <span className="text-lg font-semibold">{details.vote_average?.toFixed(1)}</span>
            <span className="text-accent text-sm">
              ({details.vote_count?.toLocaleString()} ratings)
            </span>
          </div>

          <p className="text-accent mb-4">
            {details.first_air_date?.split("-")[0]}{" "}
            {details.created_by?.length > 0 && ` | Creator: ${details.created_by[0].name}`}
          </p>

          <p className="text-accent mb-4">
            {details.number_of_seasons} seasons • {details.number_of_episodes} episodes
          </p>

          <p className="text-white leading-relaxed">{details.overview}</p>

          {/* User Rating Component */}
          <div className="mt-6">
            <p className="mb-2 font-semibold">Rate?</p>
           <Ratings showId={details.id} showTitle={details.name} />
          </div>

          {/* Watched & Listed Toggles */}
          <div className="mt-6 flex space-x-6">
            <div className="flex items-center gap-1">
              <span
                onClick={toggleWatched}
                className={`p-2 rounded-full cursor-pointer transition-colors duration-200 ${
                  !watched ? "hover:bg-secondary" : "bg-highlight text-white"
                }`}
              >
                {watched ? "✔️" : "📺"}
              </span>
              <span className="text-accent">{watched ? "Watched" : "Mark as Watched"}</span>
            </div>

            <div className="flex items-center gap-1">
              <span
                onClick={toggleListed}
                className={`p-2 rounded-full cursor-pointer transition-colors duration-200 ${
                  !listed ? "hover:bg-secondary" : "bg-highlight text-white"
                }`}
              >
                {listed ? "✔️" : "📃"}
              </span>
              <span className="text-accent">{listed ? "Listed" : "Add to List"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Shows */}
      <div className="max-w-6xl mx-auto mt-10">
        <h2 className="text-2xl font-bold mb-4">More Shows Like {details.name}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {similar.slice(0, 10).map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>
      </div>

      {/* Trending Shows */}
      <div className="max-w-6xl mx-auto mt-16">
        <h2 className="text-2xl font-bold mb-4">Trending Shows</h2>

        {trendingLoading && <p className="text-white">Loading trending shows...</p>}
        {trendingError && <p className="text-red-500">{trendingError}</p>}

        {!trendingLoading && !trendingError && (
          <div className="flex items-center gap-6">
            <button
              className="transform rotate-180 p-3 rounded-full text-white hover:text-secondary disabled:opacity-40"
              onClick={() => setTrendingIndex(prev => Math.max(prev - ITEMS_PER_PAGE, 0))}
              disabled={trendingIndex === 0}
            >
              ➤
            </button>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {trending
                .slice(trendingIndex, trendingIndex + ITEMS_PER_PAGE)
                .map(show => (
                  <div key={show.id} className="flex-shrink-0 w-40 sm:w-44 h-[20rem] mx-auto">
                    <ShowCard show={{ ...show, poster_path: show.poster_path || "/placeholder.png" }} />
                  </div>
                ))}
            </div>

            <button
              className="p-3 rounded-full text-white hover:text-secondary disabled:opacity-40"
              onClick={() =>
                setTrendingIndex(prev =>
                  Math.min(prev + ITEMS_PER_PAGE, trending.length - ITEMS_PER_PAGE)
                )
              }
              disabled={trendingIndex >= trending.length - ITEMS_PER_PAGE}
            >
              ➤
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowPage;