'use client';

import Image from 'next/image';
import TextFormInput from '@/components/form/TextFormInput';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import { Button, Card, CardBody, Col, Container, Row } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import Link from 'next/link';
import saas1 from '@/assets/images/hero/saas1.jpg';
import saas2 from '@/assets/images/hero/saas2.jpg';
import saas3 from '@/assets/images/hero/saas3.jpg';
import 'swiper/css';
const Hero = () => {
  const {
    control
  } = useForm();
  return <section className="position-relative hero-11 py-1 pt-7 pb-sm-6">
      <Container className="hero-content">
        <Row className="align-items-center">
          <Col xs={12} className="text-center">
            <h1 className="hero-title">
              The best way to <span className="highlight highlight-success d-inline-block">showcase</span> your saas
            </h1>
            <p className="fs-17 text-muted pt-0">
              Make your saas application stand out with high-quality landing page designed and developed by professional
            </p>
            <div className="mt-4 mt-sm-5 pt-0 d-flex align-items-center justify-content-center">
              <Row className="g-2 text-start">
                <TextFormInput name="name" label="Name" control={control} labelClassName="visually-hidden" className="mb-2 me-sm-2 shadow-sm" placeholder="Your Name" containerClassName="col-sm-5" />
                <TextFormInput name="email" label="Email" control={control} labelClassName="visually-hidden" className="mb-2 me-sm-2 shadow-sm" placeholder="Your Email" containerClassName="col-sm-5" />
                <Col sm={2}>
                  <Button variant="primary" type="submit" className="mb-2 text-nowrap">
                    Sign Up
                  </Button>
                </Col>
              </Row>
            </div>
            <div className="d-flex mt-2 justify-content-center">
              <div className="me-4 icons-center">
                <IconifyIcon style={{
                height: 16,
                width: 16
              }} icon="lucide:check-circle" className="icon icon-dual-success icon-xs me-1" />
                Free 14-day Demo
              </div>
              <div className="me-4 icons-center">
                <IconifyIcon style={{
                height: 16,
                width: 16
              }} icon="lucide:check-circle" className="icon icon-dual-success icon-xs me-1" />
                No credit card needed
              </div>
              <div className='icons-center'>
                <IconifyIcon icon="lucide:check-circle" style={{
                height: 16,
                width: 16
              }} className="icon icon-dual-success icon-xs me-1" />
                No Setup
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      <div className="feature-container position-relative overflow-hidden mt-5 mb-4">
        <Container>
          <Row className="align-items-center justify-content-center zindex-1 slider-container">
            <Col xs={10} className="text-center zindex-1">
              <Card className="rounded-lg shadow" data-aos="fade-up" data-aos-duration={2000}>
                <CardBody className="slider-container-body">
                  <div className="slider">
                    <Swiper modules={[Autoplay]} slidesPerView={1} autoplay={{
                    delay: 5000
                  }} roundLengths spaceBetween={0} loop breakpoints={{
                    576: {
                      slidesPerView: 1.2
                    },
                    768: {
                      slidesPerView: 1
                    }
                  }}>
                      {[saas1, saas2, saas3].map((image, idx) => <SwiperSlide key={idx}>
                          <div className="swiper-slide-content">
                            <div className="video-overlay d-flex align-items-center justify-content-center">
                              <Link href="" className="btn-play success" />
                            </div>
                            <Image src={image} alt="" className="img-fluid rounded-lg" />
                          </div>
                        </SwiperSlide>)}
                    </Swiper>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </section>;
};
export default Hero;
