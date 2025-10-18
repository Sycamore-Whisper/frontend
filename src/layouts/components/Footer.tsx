import { makeStyles, Text, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
});

const Footer = () => {
  const styles = useStyles();

  return (
    <footer className={styles.footer}>
      <Text size={200} color="subtle">
        Powered By Sycamore_Whisper
      </Text>
    </footer>
  );
};

export default Footer;