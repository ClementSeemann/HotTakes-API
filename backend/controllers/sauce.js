const Sauces = require('../models/sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauces({
      ...sauceObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  sauce.save()
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete sauceObject._userId;
  Sauces.findOne({_id: req.params.id})
      .then((sauce) => {
          if (sauce.userId != req.auth.userId) {
              res.status(401).json({ message : 'Not authorized'});
          } else {
              Sauces.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Objet modifié!'}))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};

exports.deleteSauce = (req, res, next) => {
  Sauces.findOne({ _id: req.params.id})
      .then(sauce => {
          const filename = sauce.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
              Sauces.deleteOne({_id: req.params.id})
                  .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                  .catch(error => res.status(401).json({ error }));
          });
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

exports.getOneSauce = (req, res, next) => {
    Sauces.findOne({
      _id: req.params.id
    }).then(
      (sauce) => {
        res.status(200).json(sauce);
      }
    ).catch(
      (error) => {
        res.status(404).json({
          error: error
        });
      }
    );
};

exports.getAllSauce = (req, res, next) => {
    Sauces.find().then(
      (sauce) => {
        res.status(200).json(sauce);
      }
    ).catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    )
};

// Liker les sauces

exports.likeSauce = (req, res, next) => {

  switch (req.body.like) {
    case 0:
      Sauces.findOne({ _id: req.params.id })
        .then((sauce) => {
          if (sauce.usersLiked.find(user => user === req.body.userId)) {
            Sauces.updateOne({ _id: req.params.id }, {
              $inc: { likes: -1 },
              $pull: { usersLiked: req.body.userId },
              _id: req.params.id
            })
              .then(() => { res.status(201).json({ message: 'Merci pour ton vote !' }); })
              .catch((error) => { res.status(400).json({ error: error }); });

          } if (sauce.usersDisliked.find(user => user === req.body.userId)) {
            Sauces.updateOne({ _id: req.params.id }, {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: req.body.userId },
              _id: req.params.id
            })
              .then(() => { res.status(201).json({ message: 'OK' }); })
              .catch((error) => { res.status(400).json({ error: error }); });
          }
        })
        .catch((error) => { res.status(404).json({ error: error }); });
      break;
    //likes = 1
    //uptade the sauce, send message/error
    case 1:
      Sauces.updateOne({ _id: req.params.id }, {
        $inc: { likes: 1 },
        $push: { usersLiked: req.body.userId },
        _id: req.params.id
      })
        .then(() => { res.status(201).json({ message: 'Like ajouté !' }); })
        .catch((error) => { res.status(400).json({ error: error }); });
      break;
    //likes = -1
    //uptade the sauce, send message/error
    case -1:
      Sauces.updateOne({ _id: req.params.id }, {
        $inc: { dislikes: 1 },
        $push: { usersDisliked: req.body.userId },
        _id: req.params.id
      })
        .then(() => { res.status(201).json({ message: 'Ton avis a bien été pris en compte' }) })
        .catch((error) => { res.status(400).json({ error: error }) });
      break;
    default:
      console.error('Bad request')
  }
};

