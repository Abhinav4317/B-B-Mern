import { useState } from "react";
const PlaceGallery = ({ place }) => {
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  if (showAllPhotos) {
    return (
      <div className="absolute inset-0 bg-white min-h-screen">
        <div className="p-8 grid gap-4 h-full w-full">
          <div>
            <div className="bg-red-500 py-2 px-4 rounded-2xl">
              <h2 className="text-3xl text-white underline">
                Photos of {place.title}
              </h2>
            </div>
            <button
              onClick={() => setShowAllPhotos(false)}
              className="fixed right-12 top-8 flex gap-1 py-2 px-4 rounded-2xl shadow shadow-black"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
              Close Photos
            </button>
          </div>
          {place?.photos?.length > 0 &&
            place.photos.map((photo, index) => (
              <div className="h-full w-full " key={index}>
                <img
                  className="object-cover h-full w-full"
                  src={photo}
                  alt=""
                />
              </div>
            ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="relative">
        <div className="grid gap-2 grid-cols-[2fr_1fr] rounded-3xl overflow-hidden max-h-[750px]">
          <div className="flex">
            {place?.photos?.[0] && (
              <img
                onClick={() => setShowAllPhotos(true)}
                className="cursor-pointer object-cover aspect-square"
                src={place?.photos?.[0]}
                alt=""
              />
            )}
          </div>
          <div className="grid">
            {place?.photos?.[1] && (
              <img
                onClick={() => setShowAllPhotos(true)}
                className="cursor-pointer object-cover aspect-square"
                src={place?.photos?.[1]}
                alt=""
              />
            )}
            <div className="overflow-hidden">
              {place?.photos?.[2] && (
                <img
                  onClick={() => setShowAllPhotos(true)}
                  className="cursor-pointer object-cover aspect-square relative top-2"
                  src={place?.photos?.[2]}
                  alt=""
                />
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAllPhotos(true)}
          className="flex gap-1 absolute bottom-2 right-2 bg-white rounded-2xl py-2 px-4 shadow shadow-md shadow-gray-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-6"
          >
            <path
              fillRule="evenodd"
              d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
              clipRule="evenodd"
            />
          </svg>
          Show more photos
        </button>
      </div>
    </div>
  );
};

export default PlaceGallery;
