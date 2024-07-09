const PlaceImg = ({ place, index = 0, className = null }) => {
  if (!place.photos?.length) {
    return null;
  }
  if (!className) {
    className = "object-cover rounded-lg object-contain";
  }
  return (
    place.photos?.length > 0 && (
      <img
        className={className}
        src={place.photos[index]}
        alt={place.photos[index]}
      />
    )
  );
};

export default PlaceImg;
