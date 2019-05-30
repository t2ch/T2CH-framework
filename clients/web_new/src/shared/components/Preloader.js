import React from 'react';
import { makeStyles } from '@material-ui/styles';
import Grid from '@material-ui/core/Grid';
import CircularProgress from '@material-ui/core/CircularProgress';
import NoSsr from '@material-ui/core/NoSsr';

const useStyles = makeStyles(theme => ({
  progress: {
    margin: theme.spacing.unit * 2,
  },
}));

export default function Preloader() {
  const classes = useStyles();

  return (
    <Grid
      spacing={16}
      container
      direction="column"
      justify="flex-start"
      alignItems="center"
    >
      <Grid item xs={12}>
        <NoSsr>
          <CircularProgress
            color="secondary"
            size={60}
            value={70}
            disableShrink
            className={classes.progress}
          />
        </NoSsr>
      </Grid>
    </Grid>
  );
}
