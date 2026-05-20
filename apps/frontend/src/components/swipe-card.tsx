import { motion, useMotionValue, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Anime } from "@/types/anime";

type SwipeCardProps = {
  anime: Anime;
  onSwipe: (direction: "left" | "right", anime: Anime) => void;
  onOpenDetails: (anime: Anime) => void;
};

const SWIPE_THRESHOLD = 90;
const SWIPE_VELOCITY_THRESHOLD = 500;

export const SwipeCard = ({ anime, onSwipe, onOpenDetails }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-10, 10]);
  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [0, -SWIPE_THRESHOLD], [0, 1]);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      dragMomentum={true}
      style={{ x, rotate }}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY_THRESHOLD) {
          onSwipe("right", anime);
        } else if (
          info.offset.x < -SWIPE_THRESHOLD ||
          info.velocity.x < -SWIPE_VELOCITY_THRESHOLD
        ) {
          onSwipe("left", anime);
        }
      }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      whileTap={{ cursor: "grabbing" }}
      dragSnapToOrigin
    >
      <Card className="relative h-full w-full overflow-hidden">
        <img
          src={anime.image}
          alt={anime.title}
          className="h-full w-full select-none object-cover"
          draggable={false}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
          <h3 className="text-xl font-bold">{anime.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>Score: {anime.score ?? "N/A"}</Badge>
            <Badge>Episodes: {anime.episodes ?? "?"}</Badge>
            {anime.genres.slice(0, 2).map((genre) => (
              <Badge key={genre}>{genre}</Badge>
            ))}
          </div>
          <button
            className="mt-3 text-sm font-semibold text-secondary underline"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails(anime);
            }}
          >
            View details
          </button>
        </div>

        <motion.div style={{ opacity: likeOpacity }} className="absolute left-5 top-5">
          <span className="rounded-md border-2 border-success bg-success/20 px-2 py-1 text-2xl font-bold text-success">
            LIKE
          </span>
        </motion.div>

        <motion.div style={{ opacity: nopeOpacity }} className="absolute right-5 top-5">
          <span className="rounded-md border-2 border-danger bg-danger/20 px-2 py-1 text-2xl font-bold text-danger">
            NOPE
          </span>
        </motion.div>
      </Card>
    </motion.div>
  );
};
