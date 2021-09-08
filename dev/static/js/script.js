document.addEventListener('DOMContentLoaded', function () {
    const switcher = document.querySelector('.switcher');
    const switcherImgContainer = document.querySelector('.tools__pic');

    switcher.addEventListener('click', toSwitch);

    function toSwitch(e) {
        const target = e.target;
        if (target.className === 'switcher__item') {

            for (let item of this.children) {
                item.classList.remove('active');
            }

            target.classList.add('active');
            switcherImgContainer.querySelector('.active').classList.remove('active');
            switcherImgContainer.querySelector('[data-pic="' + target.dataset.item + '"]').classList.add('active');
        }
    }

    const swiper = new Swiper('.swiper', {
        slidesPerView: "auto",
        centeredSlides: true,
        spaceBetween: 24,
        navigation: {
            nextEl: ".slider__btn_next",
            prevEl: ".slider__btn_prev",
        },
        breakpoints: {
            500: {
                slidesPerView: 'auto',
                spaceBetween: 24,
                slidesPerColumn: 1,
                centeredSlides: false,
                navigation: {
                    nextEl: ".slider__btn_next",
                    prevEl: ".slider__btn_prev",
                },
            },
        },
    });
});