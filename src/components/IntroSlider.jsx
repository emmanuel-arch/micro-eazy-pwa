import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const slides = [
    {
        id: 1,
        title: 'Manage your loans easily and securely.',
        description: 'Access your account details, make payments, and track your loan progress all in one place.',
    },
    {
        id: 2,
        title: "We're here to keep you informed every step of the way.",
        description: 'Get real-time updates on your loan status, payment schedules, and important notifications.',
    },
    {
        id: 3,
        title: 'Enjoy the convenience of managing your loan online.',
        description: 'Our user-friendly portal makes it simple to handle your finances anytime, anywhere.',
    },
];

const IntroSlider = () => {
    return (
        <div className="card adminuiux-card bg-theme-1-space position-relative overflow-hidden h-100">
            <div className="position-absolute start-0 top-0 h-100 w-100 coverimg opacity-75 z-index-0">
                <img
                    src="assets/img/background-image/background-image-8.jpg"
                    alt="Service Suite Cloud"
                />
            </div>
            <div className="card-body position-relative z-index-1">
                <div className="row h-100 d-flex flex-column justify-content-center align-items-center gx-0 text-center">
                    <div className="col-10 col-md-11 col-xl-8 mb-4 mx-auto">
                        <div className="swiper swipernavpagination pb-5">
                            <Swiper
                                modules={[Navigation, Pagination, Autoplay]}
                                navigation={false}
                                autoplay={{ delay: 2500, disableOnInteraction: false }}
                                pagination={{ clickable: true }}
                            >
                                {slides.map((slide) => (
                                    <SwiperSlide key={slide.id}>
                                        <h2 className="text-white mb-3">{slide.title}</h2>
                                        <p className="lead opacity-75">{slide.description}</p>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntroSlider;