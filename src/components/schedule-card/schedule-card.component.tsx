import React from 'react';
import { Typography } from 'shyftlabs-dsl';
import styles from './schedule-card.module.scss';
import Hyperlink from '../hyperlink/hyperlink.component';

interface IScheduleCard {
  title: string;
  location: string;
  imageSrc: string;
  id: string;
  startingIn: string;
}

const ScheduleCard: React.FC<IScheduleCard> = ({ title, location, imageSrc, id, startingIn }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src={imageSrc} alt={title} className={styles.image} />
      </div>
      <div className={styles.footer}>
        <div className={styles.startingIn}>
            <p className={
                startingIn?.includes('minutes') ? `${styles.redText}` :
                startingIn?.includes('hours') ? `${styles.orangeText}` :
                `${styles.blueText}`
            }
            >{startingIn}</p>
        </div>
        <div>
        <Typography variant="body-large-semibold" >{location}</Typography>
        <Typography variant="body-large-medium">{title}</Typography>
        </div>
        <Hyperlink url={`/schedules/${id}`} label="View Details" className={styles.hyperlink} color='primary'/>
      </div>
    </div>
  );
};

export default ScheduleCard;
