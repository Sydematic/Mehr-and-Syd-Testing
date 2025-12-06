import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../client';
import { useUser } from '../context/UserContext';

export default function Ratings({ showId, showTitle }) {
    const navigate = useNavigate();
    const { user } = useUser();

    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [showCommentBox, setShowCommentBox] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [hasExistingRating, setHasExistingRating] = useState(false);

    // Fetch existing rating on mount
    useEffect(() => {
        if (user && showId) {
            fetchExistingRating();
        }
    }, [user, showId]);

    const fetchExistingRating = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.rpc('get_user_rating', {
            p_userid: user.id,
            p_showid: showId.toString()
        });

        if (!error && data && data.length > 0) {
            setRating(data[0].rating);
            setComment(data[0].comment || '');
            setHasExistingRating(true);
        }
        setIsLoading(false);
    };

    const handleRating = async (value) => {
        // Visitor is sent to AuthPage to sign up
        if (!user) {  
            navigate('/auth?mode=signup');
            return;
        }

        // If clicking the same star, toggle comment box
        if (value === rating && hasExistingRating) {
            setShowCommentBox(!showCommentBox);
            return;
        }

        setRating(value);
        
        // If user already has a rating, save immediately without showing comment box
        // They can click again to edit comment
        if (hasExistingRating) {
            await saveRating(value, comment);
        } else {
            // New rating - show comment box
            setShowCommentBox(true);
        }
    };

    const saveRating = async (ratingValue = rating, commentValue = comment) => {
        if (!user || !ratingValue) return;

        setIsSaving(true);
        setSaveMessage('');

        // Use RPC to save rating
        const { error } = await supabase.rpc('upsert_user_rating', {
            p_userid: user.id,
            p_showid: showId.toString(),
            p_title: showTitle || "Unknown Show",
            p_rating: ratingValue,
            p_comment: commentValue
        });

        if (error) {
            console.error("Error saving rating:", error);
            setSaveMessage('Failed to save rating');
            setIsSaving(false);
            return;
        }

        // Update profile rated count
        const { data: countData } = await supabase.rpc('count_user_ratings', {
            p_userid: user.id
        });

        if (countData !== null) {
            await supabase
                .from("profiles")
                .update({ rated: countData })
                .eq("id", user.id);
        }

        setHasExistingRating(true);
        setShowCommentBox(false);
        setSaveMessage('Rating saved!');
        setIsSaving(false);

        // Clear success message after 3 seconds
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const handleSaveClick = () => {
        saveRating(rating, comment);
    };

    if (isLoading) {
        return <div className="text-accent">Loading your rating...</div>;
    }

    return (
        <div className="mt-4">
            <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={(hover || rating) >= star ? "#FFB703" : "#444"}
                        className="w-8 h-8 cursor-pointer transition-all hover:scale-110"
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => handleRating(star)}
                    >
                        <path d="M12 2l2.9 6.9 7.6.6-5.7 4.8 1.7 7.5L12 17.8 5.5 21.8l1.7-7.5L1.5 9.5l7.6-.6L12 2z" />
                    </svg>
                ))}
                
                {rating > 0 && (
                    <span className="text-sm text-accent ml-2">
                        {rating}/5 {hasExistingRating && '(click to edit comment)'}
                    </span>
                )}
            </div>

            {/* Success/Error Message */}
            {saveMessage && (
                <div className={`mt-2 text-sm ${saveMessage.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
                    {saveMessage}
                </div>
            )}

            {/* Comment Box */}
            {showCommentBox && (
                <div className="mt-4 animate-fadeIn">
                    <label className="text-sm text-accent mb-1 block">
                        Add your thoughts (optional)
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="What did you think about this show?"
                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-highlight focus:outline-none transition-colors"
                        rows="3"
                    />
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={handleSaveClick}
                            disabled={isSaving}
                            className="px-4 py-2 bg-highlight text-white rounded-lg hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSaving ? 'Saving...' : 'Save Rating'}
                        </button>
                        <button
                            onClick={() => setShowCommentBox(false)}
                            disabled={isSaving}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Display existing comment if user has one and comment box is closed */}
            {!showCommentBox && comment && hasExistingRating && (
                <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-sm text-accent mb-1">Your review:</p>
                    <p className="text-white text-sm">{comment}</p>
                    <button
                        onClick={() => setShowCommentBox(true)}
                        className="text-xs text-highlight hover:underline mt-2"
                    >
                        Edit comment
                    </button>
                </div>
            )}
        </div>
    );
}