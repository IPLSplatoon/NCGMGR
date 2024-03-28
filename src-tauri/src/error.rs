use std::error::Error;
use std::fmt;

pub trait MgrErrorCause: fmt::Display + fmt::Debug {}
impl<T: fmt::Display + fmt::Debug> MgrErrorCause for T {}

#[derive(Debug)]
pub struct MgrError {
    pub description: String,
    pub cause: Option<Box<dyn MgrErrorCause>>
}

impl MgrError {
    pub fn new(msg: &str) -> MgrError {
        MgrError { description: msg.to_string(), cause: None }
    }

    pub fn with_cause<T: 'static + MgrErrorCause>(msg: &str, cause: T) -> MgrError {
        MgrError { description: msg.to_string(), cause: Some(Box::new(cause)) }
    }

    pub fn boxed(self) -> Box<MgrError> {
        Box::new(self)
    }
}

impl fmt::Display for MgrError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        if self.cause.is_none() {
            write!(f, "{}", self.description)
        } else {
            write!(f, "{}: {}", self.description, self.cause.as_ref().unwrap())
        }
    }
}

impl Error for MgrError {

}
